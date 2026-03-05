from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.merchant import Merchant, Subscription


async def record_resolution(merchant_id: UUID, db: AsyncSession) -> None:
    """
    Records a successful AI resolution:
    - Increment ai_conversations_used on the Subscription
    - Increment Merchant.mrr based on cost_per_resolution
    """
    sub_result = await db.execute(
        select(Subscription).where(Subscription.merchant_id == merchant_id)
    )
    subscription = sub_result.scalar_one_or_none()

    merchant_result = await db.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = merchant_result.scalar_one_or_none()

    if not subscription or not merchant:
        return

    subscription.ai_conversations_used = (subscription.ai_conversations_used or 0) + 1
    merchant.mrr = (merchant.mrr or 0.0) + float(merchant.cost_per_resolution or 0.0)

    await db.commit()

