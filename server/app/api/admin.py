from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.merchant import Merchant, Subscription, User
from app.models.ticket import Ticket
from app.api.deps import get_current_superadmin


router = APIRouter(dependencies=[Depends(get_current_superadmin)])


@router.get("/stats")
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns platform-wide metrics for the God View dashboard.
    """
    # Global MRR across active merchants
    result = await db.execute(
        select(func.coalesce(func.sum(Merchant.mrr), 0.0)).where(Merchant.is_active.is_(True))
    )
    global_mrr = float(result.scalar_one() or 0.0)

    # Total active merchants
    result = await db.execute(
        select(func.count(Merchant.id)).where(Merchant.is_active.is_(True))
    )
    total_merchants = int(result.scalar_one() or 0)

    # Average AI resolution rate: AUTOPILOT tickets / total tickets
    resolved_q = await db.execute(
        select(func.count(Ticket.id)).where(Ticket.status == "AUTOPILOT")
    )
    resolved = resolved_q.scalar_one() or 0

    total_q = await db.execute(select(func.count(Ticket.id)))
    total = total_q.scalar_one() or 0

    avg_resolution_rate = float(resolved) / float(total) if total else 0.0

    return {
        "globalMrr": round(global_mrr, 2),
        "totalActiveMerchants": total_merchants,
        "avgAiResolutionRate": avg_resolution_rate,
    }


@router.get("/merchants")
async def list_merchants(db: AsyncSession = Depends(get_db)):
    """
    Lists all merchants with onboarding progress and current month's AI resolutions.
    """
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    # Base merchant + subscription info
    result = await db.execute(
        select(Merchant, Subscription)
        .outerjoin(Subscription, Subscription.merchant_id == Merchant.id)
    )
    rows = result.all()

    # Per-merchant resolution counts for current month
    res_result = await db.execute(
        select(Ticket.merchant_id, func.count(Ticket.id))
        .where(
            Ticket.status == "AUTOPILOT",
            Ticket.created_at >= month_start,
        )
        .group_by(Ticket.merchant_id)
    )
    monthly_counts = {merchant_id: count for merchant_id, count in res_result}

    payload = []
    for merchant, sub in rows:
        payload.append(
            {
                "id": str(merchant.id),
                "name": merchant.name,
                "onboarding_step": merchant.onboarding_step,
                "mrr": merchant.mrr or 0.0,
                "ai_conversations_used": (sub.ai_conversations_used if sub else 0),
                "monthly_resolutions": monthly_counts.get(merchant.id, 0),
            }
        )

    return payload

