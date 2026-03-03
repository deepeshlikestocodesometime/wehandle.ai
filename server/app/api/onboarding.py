from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.merchant import Merchant, User
from app.models.ai import Persona, KnowledgeChunk
from app.api.deps import get_current_user
from app.schemas.onboarding import StoreConnect, PersonaUpdate, OnboardingStatus

router = APIRouter()

@router.post("/step1/connect", response_model=OnboardingStatus)
async def connect_store(data: StoreConnect, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    merchant = current_user.merchant
    merchant.store_domain = data.store_domain
    merchant.onboarding_step = 2
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}

@router.post("/step2/knowledge", response_model=OnboardingStatus)
async def mock_ingest_knowledge(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Mock endpoint for now (S3/Vector logic will go here)
    merchant = current_user.merchant
    merchant.onboarding_step = 3
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}

@router.put("/step3/persona", response_model=OnboardingStatus)
async def update_persona(data: PersonaUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    merchant = current_user.merchant
    
    result = await db.execute(select(Persona).where(Persona.merchant_id == merchant.id))
    persona = result.scalar_one()
    
    persona.tone_of_voice = data.tone_of_voice
    persona.emoji_density = data.emoji_density
    merchant.onboarding_step = 4
    
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}

@router.post("/step4/deploy", response_model=OnboardingStatus)
async def finish_deployment(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    merchant = current_user.merchant
    merchant.onboarding_step = 5 # 5 means LIVE/COMPLETED
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}