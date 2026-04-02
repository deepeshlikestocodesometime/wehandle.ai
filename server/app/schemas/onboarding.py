from pydantic import BaseModel
from typing import List, Optional
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


class PersonaPreviewRequest(BaseModel):
    query: str = "What is your return policy?"
    tone_of_voice: Optional[str] = None
    emoji_density: Optional[str] = None


class PersonaPreviewResponse(BaseModel):
    reply: str
    cognitive_flow: List[str]
    sources_used: int