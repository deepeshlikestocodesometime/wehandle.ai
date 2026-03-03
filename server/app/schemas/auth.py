from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID

# --- REQUEST SCHEMAS (Data coming FROM React) ---

class UserCreate(BaseModel):
    """Payload for 'Start Your Trial' (Signup)"""
    store_name: str = Field(..., min_length=2, description="e.g. Luminaire Co.")
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    """Payload for 'Welcome Back' (Login)"""
    email: EmailStr
    password: str

# --- RESPONSE SCHEMAS (Data going TO React) ---

class Token(BaseModel):
    """JWT Token Response"""
    access_token: str
    token_type: str = "bearer"

class MerchantResponse(BaseModel):
    id: UUID
    name: str
    store_domain: Optional[str] = None
    onboarding_step: int

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    merchant: Optional[MerchantResponse] = None

    class Config:
        from_attributes = True