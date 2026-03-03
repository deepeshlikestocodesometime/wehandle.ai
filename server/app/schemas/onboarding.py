from pydantic import BaseModel
from typing import Optional

class StoreConnect(BaseModel):
    store_domain: str

class PersonaUpdate(BaseModel):
    tone_of_voice: str
    emoji_density: str

class OnboardingStatus(BaseModel):
    onboarding_step: int