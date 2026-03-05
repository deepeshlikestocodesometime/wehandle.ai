import enum
from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import BaseModel

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"   # For YOU (WeHandle.ai internal team)
    MERCHANT = "merchant"       # For the client owner (e.g., Luminaire Co.)
    AGENT = "agent"             # For client's human support staff

class Merchant(BaseModel):
    __tablename__ = "merchants"

    name = Column(String, nullable=False)
    store_domain = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)

    # --- SHOPIFY PLUS INTEGRATION ---
    # Raw access token should be encrypted at rest in a real deployment.
    shopify_access_token = Column(String, nullable=True)
    shopify_shop_url = Column(String, unique=True, index=True, nullable=True)
    shopify_scopes = Column(String, nullable=True)
    
    # --- ADMIN GOD VIEW DATA ---
    onboarding_step = Column(Integer, default=1) # Tracks Step 1 to 4 drop-offs
    mrr = Column(Float, default=0.0)             # Global revenue tracking
    cost_per_resolution = Column(Float, default=0.90) # Client's contracted rate
    api_key = Column(String, nullable=True)
    
    users = relationship("User", back_populates="merchant", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    persona = relationship("Persona", back_populates="merchant", uselist=False, cascade="all, delete-orphan")

class User(BaseModel):
    __tablename__ = "users"

    merchant_id = Column(ForeignKey("merchants.id"), nullable=True) # Null if SUPERADMIN
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MERCHANT)
    two_factor_secret = Column(String, nullable=True)
    is_two_factor_enabled = Column(Boolean, default=False)
    
    merchant = relationship("Merchant", back_populates="users")

class Subscription(BaseModel):
    __tablename__ = "subscriptions"

    merchant_id = Column(ForeignKey("merchants.id"), unique=True, index=True)
    stripe_customer_id = Column(String, nullable=True)
    plan_name = Column(String, default="Growth")
    
    # --- QUOTA TRACKING (Maps to Settings UI) ---
    ai_conversations_limit = Column(Integer, default=5000)
    ai_conversations_used = Column(Integer, default=0)
    knowledge_points_limit = Column(Integer, default=500)
    knowledge_points_used = Column(Integer, default=0)

    merchant = relationship("Merchant", back_populates="subscription")