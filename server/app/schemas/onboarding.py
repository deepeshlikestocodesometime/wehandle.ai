from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class StoreConnect(BaseModel):
    store_domain: str


class ShopifyAuthRedirect(BaseModel):
    authorization_url: str


class VerifyDeploymentRequest(BaseModel):
    merchant_id: Optional[UUID] = None
    shop_url: Optional[str] = None

class PersonaUpdate(BaseModel):
    tone_of_voice: str
    emoji_density: str

class OnboardingStatus(BaseModel):
    onboarding_step: int