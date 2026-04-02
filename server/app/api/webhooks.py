import hmac
import logging
import os
from hashlib import sha256
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.websocket_manager import manager
from app.models.merchant import Merchant
from app.models.ticket import Ticket, Message, Channel
from app.services.ai_service import generate_omnichannel_reply

router = APIRouter()
logger = logging.getLogger(__name__)


def _verify_signature(request: Request, body: bytes) -> None:
    """
    Optional signature verification for providers like Postmark/SendGrid.
    If signature headers and secrets are configured, validate HMAC; otherwise, allow.
    """
    # Example: Postmark
    pm_sig = request.headers.get("X-Postmark-Signature")
    pm_secret = os.getenv("POSTMARK_WEBHOOK_SECRET")
    if pm_sig and pm_secret:
        digest = hmac.new(pm_secret.encode("utf-8"), body, sha256).hexdigest()
        if not hmac.compare_digest(digest, pm_sig):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")


def _parse_address(address: str) -> Optional[str]:
    """
    Returns the email address without display name: `Name <addr>` -> `addr`.
    """
    if "<" in address and ">" in address:
        return address.split("<", 1)[1].split(">", 1)[0].strip()
    return address.strip()


async def _resolve_merchant_by_to_email(db: AsyncSession, to_email: str) -> Optional[Merchant]:
    inbound_domain = os.getenv("WEHANDLE_INBOUND_DOMAIN", "").lower()
    addr = _parse_address(to_email).lower()
    local_part, _, domain = addr.partition("@")

    if inbound_domain and domain != inbound_domain:
        # Not targeted at our inbound domain
        return None

    # Strategy 1: local part encodes merchant UUID after '+', e.g. support+{merchant_id}@resolve.wehandle.ai
    merchant_id_part = None
    if "+" in local_part:
        merchant_id_part = local_part.split("+", 1)[1]

    if merchant_id_part:
        try:
            m_id = UUID(merchant_id_part)
            result = await db.execute(select(Merchant).where(Merchant.id == m_id))
            merchant = result.scalar_one_or_none()
            if merchant:
                return merchant
        except ValueError:
            pass

    # Strategy 2: match by store_domain slug if present
    result = await db.execute(select(Merchant).where(Merchant.store_domain.ilike(f"%{local_part}%")))
    return result.scalar_one_or_none()


@router.post("/inbound-email")
async def inbound_email_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Receives inbound email webhooks (Postmark/SendGrid style) and
    converts them into Tickets + Messages, then triggers AI reply.
    """
    raw_body = await request.body()
    _verify_signature(request, raw_body)

    try:
        payload: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    from_email = payload.get("From") or payload.get("from")
    to_email = payload.get("To") or payload.get("to")
    subject = payload.get("Subject") or payload.get("subject")
    body = (
        payload.get("StrippedTextReply")
        or payload.get("TextBody")
        or payload.get("text")
        or ""
    )

    if not from_email or not to_email:
        raise HTTPException(status_code=400, detail="Missing From/To fields")

    merchant = await _resolve_merchant_by_to_email(db, to_email)
    if not merchant:
        # Always 200 so Postmark stops retrying; invalid mail is dropped.
        logger.warning(
            "Dropped inbound email: Merchant not found for address %s",
            to_email,
        )
        return {"status": "ignored", "detail": "Merchant not found"}

    from_addr = _parse_address(from_email).lower()

    # Find existing open ticket for this customer, if any
    result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.messages))
        .where(
            Ticket.merchant_id == merchant.id,
            Ticket.customer_email == from_addr,
            Ticket.status != "RESOLVED",
        )
        .order_by(Ticket.created_at.desc())
    )
    ticket = result.scalars().first()
    created_new = False

    if not ticket:
        ticket = Ticket(
            merchant_id=merchant.id,
            customer_email=from_addr,
            customer_name=None,
            intent=None,
            channel=Channel.EMAIL,
            status="AUTOPILOT",
        )
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)
        created_new = True

        # Broadcast ticket created to live dashboards
        await manager.broadcast_ticket_update(
            merchant.id,
            {
                "type": "ticket.created",
                "ticketId": str(ticket.id),
                "status": ticket.status,
                "channel": ticket.channel.value if getattr(ticket, "channel", None) else None,
                "customer_email": ticket.customer_email,
                "customer_name": ticket.customer_name,
                "intent": ticket.intent,
            },
        )

    # Create the inbound customer message
    new_message = Message(
        ticket_id=ticket.id,
        sender_type="CUSTOMER",
        content=body or subject or "",
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    await db.refresh(ticket, ["messages"])

    # Trigger AI auto-reply pipeline
    await generate_omnichannel_reply(ticket.id, db)

    return {"status": "accepted"}


@router.get("/meta")
async def meta_verify(
    request: Request,
):
    """
    Handles Meta (Facebook/Instagram/WhatsApp) webhook verification.
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    verify_token = os.getenv("META_VERIFY_TOKEN")

    if mode == "subscribe" and verify_token and token == verify_token:
        return PlainTextResponse(challenge or "")

    raise HTTPException(status_code=403, detail="Meta verification failed")


@router.post("/meta")
async def meta_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Handles Meta (Instagram / WhatsApp) inbound messages.
    NOTE: This is a simplified handler; in production you'd branch
    on object/type for IG vs WA and parse message bodies more deeply.
    """
    body = await request.json()

    entries = body.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            # WhatsApp messages array
            messages = value.get("messages") or []
            for msg in messages:
                sender_id = msg.get("from")
                text = msg.get("text", {}).get("body", "")
                channel = Channel.WHATSAPP

                await _handle_meta_message(db, sender_id, text, channel)

            # Instagram DMs (simplified)
            if value.get("messaging_product") == "instagram":
                for msg in value.get("messages", []):
                    sender_id = msg.get("from")
                    text = msg.get("text", {}).get("body", "")
                    channel = Channel.INSTAGRAM
                    await _handle_meta_message(db, sender_id, text, channel)

    return {"status": "accepted"}


async def _handle_meta_message(db: AsyncSession, sender_id: str, text: str, channel: Channel) -> None:
    """
    Normalizes Meta messages into Tickets + Messages and triggers AI.
    """
    if not sender_id or not text:
        return

    # For now, assume a single merchant deployment; in production, map via page ID / phone number.
    result = await db.execute(select(Merchant).where(Merchant.is_active.is_(True)))
    merchant = result.scalars().first()
    if not merchant:
        return

    # Reuse sender_id as customer_email surrogate for IG/WA
    result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.messages))
        .where(
            Ticket.merchant_id == merchant.id,
            Ticket.customer_email == sender_id,
            Ticket.status != "RESOLVED",
        )
        .order_by(Ticket.created_at.desc())
    )
    ticket = result.scalars().first()

    if not ticket:
        ticket = Ticket(
            merchant_id=merchant.id,
            customer_email=sender_id,
            customer_name=None,
            intent=None,
            channel=channel,
            status="AUTOPILOT",
        )
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)

        await manager.broadcast_ticket_update(
            merchant.id,
            {
                "type": "ticket.created",
                "ticketId": str(ticket.id),
                "customer_email": ticket.customer_email,
                "customer_name": ticket.customer_name,
                "intent": ticket.intent,
            },
        )

    msg = Message(
        ticket_id=ticket.id,
        sender_type="CUSTOMER",
        content=text,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    await db.refresh(ticket, ["messages"])

    await generate_omnichannel_reply(ticket.id, db)

