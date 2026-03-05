import secrets

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.merchant import Merchant, User
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

