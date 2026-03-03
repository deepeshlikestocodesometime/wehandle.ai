from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.merchant import Merchant, User, Subscription
from app.models.ai import Persona
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 1. Create Merchant
    new_merchant = Merchant(name=user_in.store_name)
    db.add(new_merchant)
    await db.flush() # Get the new merchant ID

    # 2. Create User
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        merchant_id=new_merchant.id
    )
    db.add(new_user)

    # 3. Create Default Subscription & AI Persona
    db.add(Subscription(merchant_id=new_merchant.id))
    db.add(Persona(merchant_id=new_merchant.id))
    
    await db.commit()

    # Generate JWT
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user