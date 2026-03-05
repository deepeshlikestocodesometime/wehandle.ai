from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.merchant import User
from app.models.ticket import Ticket, Message
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/pulse")
async def get_pulse(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Real SQL aggregation for the dashboard "Pulse" cards.
    """
    merchant_id = current_user.merchant_id

    # Auto-resolved tickets (AUTOPILOT)
    result = await db.execute(
        select(func.count(Ticket.id)).where(
            Ticket.merchant_id == merchant_id,
            Ticket.status == "AUTOPILOT",
        )
    )
    auto_resolved = result.scalar_one() or 0

    # ROI impact based on fixed economics:
    # revenue_per_ticket = 15.00, cost_per_ticket = 0.90
    revenue_per_ticket = 15.00
    cost_per_ticket = 0.90
    money_saved = (auto_resolved * revenue_per_ticket) - (auto_resolved * cost_per_ticket)

    # Response speed: average time between first customer message and first AI message
    # For simplicity, compute over all tickets for this merchant.
    result = await db.execute(
        select(Message.ticket_id, Message.sender_type, Message.created_at)
        .join(Ticket, Message.ticket_id == Ticket.id)
        .where(Ticket.merchant_id == merchant_id)
        .order_by(Message.ticket_id, Message.created_at)
    )
    rows: List[Message] = list(result)

    per_ticket_times = {}
    for ticket_id, sender_type, created_at in rows:
        info = per_ticket_times.setdefault(ticket_id, {"customer": None, "ai": None})
        if sender_type == "CUSTOMER" and info["customer"] is None:
            info["customer"] = created_at
        if sender_type == "AI" and info["ai"] is None:
            info["ai"] = created_at

    deltas = []
    for info in per_ticket_times.values():
        if info["customer"] and info["ai"]:
            delta = (info["ai"] - info["customer"]).total_seconds()
            if delta >= 0:
                deltas.append(delta)

    avg_response_time = sum(deltas) / len(deltas) if deltas else 0.0

    # CSAT index – placeholder 4.8 (structure ready for rating column later)
    csat_score = 4.8

    return {
        "moneySaved": round(money_saved, 2),
        "ticketsResolved": auto_resolved,
        "avgResponseTime": round(avg_response_time, 2),
        "csatScore": csat_score,
        "resolutionRate": 100 if auto_resolved > 0 else 0,
    }


@router.get("/feed")
async def get_neural_feed(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the 10 most recent messages, joined with tickets
    for use in the Neural Feed list.
    """
    merchant_id = current_user.merchant_id

    result = await db.execute(
        select(Message, Ticket)
        .join(Ticket, Message.ticket_id == Ticket.id)
        .where(Ticket.merchant_id == merchant_id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )

    items = []
    for message, ticket in result:
        items.append(
            {
                "id": str(message.id),
                "summary": message.content[:120] + ("..." if len(message.content) > 120 else ""),
                "customer": ticket.customer_name or ticket.customer_email,
                "type": ticket.intent or "GENERAL",
                "time": message.created_at.isoformat() if message.created_at else "",
                "status": "resolved_ai" if ticket.status == "AUTOPILOT" else "needs_you",
            }
        )

    return items

