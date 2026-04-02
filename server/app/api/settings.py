import secrets

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.merchant import Merchant, User, Subscription
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/api-key")
async def get_api_key(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
  result = await db.execute(select(Merchant).where(Merchant.id == current_user.merchant_id))
  merchant = result.scalar_one_or_none()
  api_key = merchant.api_key if merchant else None

  return {
    "api_key": api_key or "",
    "two_factor_enabled": bool(current_user.is_two_factor_enabled),
  }


@router.post("/api-key/rotate")
async def rotate_api_key(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
  result = await db.execute(select(Merchant).where(Merchant.id == current_user.merchant_id))
  merchant = result.scalar_one_or_none()
  if not merchant:
    return {"api_key": ""}

  new_key = f"wh_live_{secrets.token_urlsafe(24)}"
  merchant.api_key = new_key
  await db.commit()

  return {"api_key": new_key}


@router.get("/billing/usage")
async def get_billing_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
  """
  Returns current usage vs limits for the Settings "Billing" meters.
  """
  result = await db.execute(
    select(Subscription).where(Subscription.merchant_id == current_user.merchant_id)
  )
  sub = result.scalar_one_or_none()

  default_ai_limit = 5000
  default_kb_limit = 500

  if not sub:
    return {
      "ai_conversations_used": 0,
      "ai_conversations_limit": default_ai_limit,
      "knowledge_points_used": 0,
      "knowledge_points_limit": default_kb_limit,
      "plan_name": None,
    }

  return {
    "ai_conversations_used": int(sub.ai_conversations_used or 0),
    "ai_conversations_limit": int(sub.ai_conversations_limit or default_ai_limit),
    "knowledge_points_used": int(sub.knowledge_points_used or 0),
    "knowledge_points_limit": int(sub.knowledge_points_limit or default_kb_limit),
    "plan_name": sub.plan_name,
  }

