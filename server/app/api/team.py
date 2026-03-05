from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.merchant import User, UserRole
from app.api.deps import get_current_user

router = APIRouter()


def _ensure_owner(user: User) -> None:
  if user.role not in (UserRole.MERCHANT, UserRole.SUPERADMIN):
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Only merchant owners can manage team members.",
    )


@router.get("")
async def list_team(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
  _ensure_owner(current_user)

  result = await db.execute(
    select(User).where(User.merchant_id == current_user.merchant_id)
  )
  users = result.scalars().all()

  return [
    {
      "id": str(u.id),
      "email": u.email,
      "role": u.role.value,
    }
    for u in users
  ]


@router.post("/invite")
async def invite_agent(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
  _ensure_owner(current_user)

  # Ensure email is not already used
  result = await db.execute(select(User).where(User.email == email))
  if result.scalar_one_or_none():
    raise HTTPException(status_code=400, detail="User with this email already exists.")

  placeholder_password = get_password_hash("temporary-password")

  new_user = User(
    merchant_id=current_user.merchant_id,
    email=email,
    hashed_password=placeholder_password,
    role=UserRole.AGENT,
  )
  db.add(new_user)
  await db.commit()
  await db.refresh(new_user)

  return {
    "id": str(new_user.id),
    "email": new_user.email,
    "role": new_user.role.value,
  }


@router.delete("/{user_id}")
async def remove_agent(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
  _ensure_owner(current_user)

  result = await db.execute(select(User).where(User.id == user_id, User.merchant_id == current_user.merchant_id))
  user = result.scalar_one_or_none()

  if not user:
    raise HTTPException(status_code=404, detail="User not found")

  if user.id == current_user.id:
    raise HTTPException(status_code=400, detail="You cannot remove your own access.")

  await db.delete(user)
  await db.commit()

  return {"status": "deleted"}

