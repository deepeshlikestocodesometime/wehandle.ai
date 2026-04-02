import json
import os
from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from openai import AsyncOpenAI

from app.models.merchant import Merchant
from app.models.ticket import Ticket, Message
from app.models.ai import Persona
from app.services.shopify_service import ShopifyBridge
from app.services.message_router import dispatch_response
from app.core.websocket_manager import manager
from app.services.rag_service import get_relevant_context
from app.services.billing_service import record_resolution


def check_return_eligibility(shopify_context: Dict[str, Any], kb_rules: List[str]) -> Dict[str, Any]:
    """
    Very lightweight helper that:
    - Infers a return window in days from the knowledge snippets (e.g. "30-Day Policy")
    - Compares the most recent order's processedAt date to current time
    - Returns { eligible: bool, window_days: int | None }
    """
    from datetime import datetime, timezone
    import re

    window_days = None
    # Find a pattern like "30-day" or "30 day" in the rules text
    for rule in kb_rules:
        match = re.search(r"(\d+)\s*[- ]?\s*day", rule, flags=re.IGNORECASE)
        if match:
            try:
                window_days = int(match.group(1))
                break
            except ValueError:
                continue

    orders = (shopify_context or {}).get("orders") or []
    if not orders or not window_days:
        return {"eligible": False, "window_days": window_days}

    # Take the most recent order
    latest_order = orders[0]
    processed_at = latest_order.get("processedAt")
    if not processed_at:
        return {"eligible": False, "window_days": window_days}

    try:
        order_dt = datetime.fromisoformat(processed_at.replace("Z", "+00:00"))
    except Exception:
        return {"eligible": False, "window_days": window_days}

    now = datetime.now(timezone.utc)
    delta_days = (now - order_dt).days
    eligible = delta_days <= window_days

    return {"eligible": eligible, "window_days": window_days, "order_name": latest_order.get("name")}


async def generate_omnichannel_reply(ticket_id: UUID, db: AsyncSession) -> Message:
    """
    Orchestrates Shopify context, Knowledge Hub rules, and Persona to generate
    an omnichannel reply, then persists and dispatches it via the proper channel.
    """
    # 1. Load ticket + merchant context
    ticket_result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.messages))
        .where(Ticket.id == ticket_id)
    )
    ticket = ticket_result.scalar_one_or_none()
    if not ticket:
        raise ValueError("Ticket not found")

    merchant_result = await db.execute(select(Merchant).where(Merchant.id == ticket.merchant_id))
    merchant = merchant_result.scalar_one_or_none()
    if not merchant:
        raise ValueError("Merchant not found for ticket")

    # 2. Shopify context
    shopify_bridge = ShopifyBridge(db)
    shopify_context = await shopify_bridge.get_customer_context(ticket.customer_email, merchant.id)
    print(f"DEBUG: AI Service received context: {shopify_context}")
    customer_found = bool((shopify_context or {}).get("customer_found"))

    # 3. Knowledge rules via RAG retriever

    # 4. Persona (tone + emoji density)
    persona_result = await db.execute(select(Persona).where(Persona.merchant_id == merchant.id))
    persona = persona_result.scalar_one_or_none()

    tone = persona.tone_of_voice if persona else "Neutral"
    emoji_density = persona.emoji_density if persona else "Moderate"

    # 5. Construct Master Prompt
    brand_name = merchant.name
    channel = getattr(ticket, "channel", None)
    channel_name = channel.value if channel is not None else "EMAIL"

    shopify_summary = str(shopify_context)

    customer_name = ticket.customer_name or "Customer"
    query_text = ""
    if ticket.messages:
        # Use the latest customer message as the query
        customer_messages = [m for m in ticket.messages if m.sender_type == "CUSTOMER"]
        if customer_messages:
            query_text = customer_messages[-1].content

    api_key = os.getenv("OPENAI_API_KEY")
    # Pre-compute RAG context using the customer query
    rag_chunks = await get_relevant_context(db, query_text, merchant.id, top_k=3) if api_key else []
    kb_rules = [kc.content for kc in rag_chunks]
    rules_summary = "\n".join(f"- {r}" for r in kb_rules[:8])

    # Return eligibility helper based on Shopify context + RAG rules
    return_info = check_return_eligibility(shopify_context, kb_rules)

    system_prompt = (
        f"You are the AI Concierge for {brand_name}. "
        f"Respond in a {tone} tone. Emoji density preference: {emoji_density}."
        " You will receive Shopify context and a set of knowledge snippets. "
        "First decide if you can fully resolve the request. Then answer."
    )

    user_prompt = (
        f"Customer {customer_name} is asking via {channel_name}: \"{query_text}\".\n\n"
        f"Their Shopify context is:\n{shopify_summary}\n\n"
        f"Relevant knowledge snippets:\n{rules_summary}\n\n"
        f"Return eligibility analysis: Eligible={return_info.get('eligible')} "
        f"within {return_info.get('window_days')} days window.\n\n"
        "Respond in strict JSON with two keys:\n"
        "  - \"answer\": the final reply text you would send to the customer.\n"
        "  - \"confidence\": a number between 0 and 1 representing how confident you are that this fully resolves the issue.\n"
        "Do not include any additional keys or commentary outside of the JSON."
    )

    if not api_key:
        # Graceful degradation when model is not configured
        ai_reply = (
            "I'm unable to access the AI engine right now, but your request has "
            "been received and a human agent will follow up shortly."
        )
        confidence = 0.0
    else:
        client = AsyncOpenAI(api_key=api_key)
        try:
            completion = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            raw_content = completion.choices[0].message.content or ""
            try:
                data = json.loads(raw_content)
                ai_reply = data.get("answer", raw_content)
                confidence = float(data.get("confidence", 0.0))
            except Exception:
                ai_reply = raw_content
                confidence = 0.0
        except Exception:
            # Fallback on any OpenAI transport/model errors
            ai_reply = (
                "I'm having trouble generating an automated response right now. "
                "A human agent will review this conversation shortly."
            )
            confidence = 0.0

    # 6. Persist AI message with cognitive logs
    cognitive_steps = [
        "Searching knowledge base for policy matches...",
        "Connecting to Shopify Admin API...",
        f"Shopify Context: {'Customer profile hydrated' if customer_found else 'No customer record found'}",
        f"Persona applied: {tone} tone with {emoji_density} emoji density.",
    ]

    cognitive_logs: Dict[str, Any] = {
        "flow_steps": cognitive_steps,
        "shopify_context": shopify_context,
        "rules_used_count": len(kb_rules),
        "tone": tone,
        "emoji_density": emoji_density,
        "channel": channel_name,
        "confidence": confidence,
        "return_eligible": return_info.get("eligible"),
        "return_window_days": return_info.get("window_days"),
        "order_name": return_info.get("order_name"),
        "intent": ticket.intent,
    }

    message = Message(
        ticket_id=ticket.id,
        sender_type="AI",
        content=ai_reply,
        cognitive_logs=cognitive_logs,
    )

    auto_send = confidence >= 0.85

    if auto_send:
        ticket.status = "AUTOPILOT"
    else:
        ticket.status = "NEEDS_YOU"

    db.add(message)
    await db.commit()
    await db.refresh(message)

    # 7. Dispatch back through the original channel and record billing
    if auto_send:
        await dispatch_response(db, ticket, ai_reply)
        await record_resolution(ticket.merchant_id, db)

    # Broadcast to live inbox clients regardless of confidence
    await manager.broadcast_ticket_update(
        ticket.merchant_id,
        {
            "type": "message.new",
            "ticketId": str(ticket.id),
            "message": {
                "id": str(message.id),
                "sender_type": message.sender_type,
                "content": message.content,
                "created_at": message.created_at.isoformat() if message.created_at else "",
                "cognitive_logs": message.cognitive_logs,
            },
        },
    )

    return message

