import hmac
import json
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import httpx
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.merchant import Merchant, User
from app.models.ai import Persona
from app.api.deps import get_current_user
from app.schemas.onboarding import (
    StoreConnect,
    PersonaUpdate,
    OnboardingStatus,
    ShopifyAuthRedirect,
    PersonaPreviewRequest,
    PersonaPreviewResponse,
)
from app.services.rag_service import get_relevant_context
from openai import AsyncOpenAI

router = APIRouter()
logger = logging.getLogger(__name__)
OPENAI_DISABLED_MESSAGE = "OpenAI Key missing. Ingestion and Preview disabled."


def _canonicalize_shop_domain(raw_domain: str) -> str:
    raw = raw_domain.strip().lower()
    if raw.endswith(".myshopify.com"):
        return raw
    return f"{raw}.myshopify.com"


def _verify_shopify_hmac(request: Request, api_secret: str) -> bool:
    provided_hmac = request.query_params.get("hmac")
    if not provided_hmac:
        return False

    # Shopify requires all query params except hmac/signature, sorted lexicographically.
    pairs = [
        (key, value)
        for key, value in request.query_params.multi_items()
        if key not in {"hmac", "signature"}
    ]
    message = "&".join(f"{key}={value}" for key, value in sorted(pairs, key=lambda item: item[0]))
    digest = hmac.new(api_secret.encode("utf-8"), message.encode("utf-8"), sha256).hexdigest()
    return hmac.compare_digest(digest, provided_hmac)


def _extract_preview_reply(raw_content: str) -> str:
    """
    Normalizes model output to plain chat text.
    Handles:
    - JSON payloads like {"answer":"..."}
    - Markdown code fences containing JSON
    - Plain text replies
    """
    content = (raw_content or "").strip()
    if not content:
        return ""

    if content.startswith("```"):
        lines = content.splitlines()
        if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].startswith("```"):
            content = "\n".join(lines[1:-1]).strip()
            if content.lower().startswith("json"):
                content = content[4:].strip()

    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return str(parsed.get("answer") or parsed.get("reply") or content).strip()
    except Exception:
        pass

    return content


@router.post("/step1/connect", response_model=ShopifyAuthRedirect)
async def connect_store(
    data: StoreConnect,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiates the Shopify OAuth handshake for Step 1."""
    try:
        merchant = current_user.merchant
        if not merchant:
            raise ValueError("Merchant not found for user")

        shop_domain = _canonicalize_shop_domain(data.store_domain)

        client_id = os.getenv("SHOPIFY_API_KEY")
        redirect_uri = os.getenv("SHOPIFY_REDIRECT_URI")
        scopes = os.getenv(
            "SHOPIFY_SCOPES",
            "read_orders,write_orders,read_customers,read_products",
        )

        if not client_id:
            raise ValueError("Missing SHOPIFY_API_KEY")
        if not redirect_uri:
            raise ValueError("Missing SHOPIFY_REDIRECT_URI")
        if not SECRET_KEY:
            raise ValueError("Missing JWT secret (WEHANDLE_JWT_SECRET)")

        # CSRF protection: signed JWT with short expiry and high-entropy nonce.
        state_payload = {
            "sub": str(current_user.id),
            "merchant_id": str(merchant.id),
            "shop": shop_domain,
            "nonce": secrets.token_urlsafe(32),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        }
        state_token = jwt.encode(state_payload, SECRET_KEY, algorithm=ALGORITHM)

        params = {
            "client_id": client_id,
            "scope": scopes,
            "redirect_uri": redirect_uri,
            "state": state_token,
        }

        authorization_url = f"https://{shop_domain}/admin/oauth/authorize"
        # Persist the intended store domain so we can complete handshake later
        merchant.store_domain = shop_domain
        await db.commit()

        return {"authorization_url": f"{authorization_url}?{urlencode(params)}"}
    except Exception as exc:
        logger.exception("Shopify connect_store failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shopify OAuth setup failed: {str(exc)}",
        )

@router.get("/shopify/callback")
async def shopify_callback(
    request: Request,
    code: str,
    shop: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Shopify redirects here after the merchant approves the app."""
    api_key = os.getenv("SHOPIFY_API_KEY")
    api_secret = os.getenv("SHOPIFY_API_SECRET")
    frontend_url = os.getenv("WEHANDLE_FRONTEND_URL")
    if not frontend_url:
        raise RuntimeError("WEHANDLE_FRONTEND_URL environment variable is required")

    if not api_key or not api_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Shopify app not configured")

    if not _verify_shopify_hmac(request, api_secret):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Shopify callback HMAC")

    try:
        payload = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        merchant_id = payload.get("merchant_id")
        expected_shop = payload.get("shop")
        if not user_id or not merchant_id:
            raise JWTError("Missing context in state token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    # Resolve merchant from state-bound user context.
    user_result = await db.execute(
        select(User).where(User.id == user_id, User.merchant_id == merchant_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Merchant context not found")

    merchant_result = await db.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = merchant_result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Merchant not found")

    # Basic safety check that the shop matches the state payload
    shop_domain = shop.lower()
    if expected_shop and expected_shop != shop_domain:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop mismatch")

    token_endpoint = f"https://{shop_domain}/admin/oauth/access_token"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            token_endpoint,
            json={
                "client_id": api_key,
                "client_secret": api_secret,
                "code": code,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange Shopify OAuth code (status {resp.status_code})",
        )

    token_data = resp.json()
    access_token = token_data.get("access_token")
    scopes = token_data.get("scope")

    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing access token from Shopify")

    # Persist credentials on the merchant
    # Prevent one Shopify store from being connected to multiple merchants.
    existing_result = await db.execute(
        select(Merchant).where(Merchant.store_domain == shop_domain)
    )
    existing_merchant = existing_result.scalar_one_or_none()
    if existing_merchant and str(existing_merchant.id) != str(merchant.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Shopify store is already connected to another account",
        )

    merchant.shopify_access_token = access_token
    merchant.shopify_shop_url = f"https://{shop_domain}"
    merchant.shopify_scopes = scopes
    merchant.store_domain = shop_domain
    merchant.onboarding_step = 2
    try:
        await db.commit()
    except IntegrityError:
        # Ensure we never expose raw DB errors (e.g., UniqueViolation) to the frontend.
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Shopify store is already connected to another account",
        )

    # Redirect the merchant back into the onboarding flow
    redirect_frontend = frontend_url.rstrip("/") + "/step-2"
    return RedirectResponse(url=redirect_frontend, status_code=status.HTTP_302_FOUND)


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
    merchant.onboarding_step = 5
    
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}

@router.post("/step4/deploy", response_model=OnboardingStatus)
async def finish_deployment(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    merchant = current_user.merchant
    merchant.onboarding_step = 5 # 5 means LIVE/COMPLETED
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}


@router.post("/step3/preview", response_model=PersonaPreviewResponse)
async def generate_persona_preview(
    data: PersonaPreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    merchant = current_user.merchant
    if not merchant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Merchant not found for user")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail=OPENAI_DISABLED_MESSAGE)

    persona_result = await db.execute(select(Persona).where(Persona.merchant_id == merchant.id))
    persona = persona_result.scalar_one_or_none()
    tone = (data.tone_of_voice or (persona.tone_of_voice if persona else "Neutral")).strip()
    emoji_density = (data.emoji_density or (persona.emoji_density if persona else "Moderate")).strip()

    query = (data.query or "").strip() or "What is your return policy?"
    rag_chunks = await get_relevant_context(db, query, merchant.id, top_k=3)
    kb_rules = [c.content for c in rag_chunks]
    rules_summary = "\n".join(f"- {r}" for r in kb_rules[:8]) if kb_rules else "- No knowledge documents found."

    system_prompt = (
        f"You are the AI Concierge for {merchant.name}. "
        f"Tone must be {tone}. Emoji density must be {emoji_density}. "
        "Answer based on the provided knowledge snippets. "
        "If snippets are missing, say you need knowledge uploaded. "
        "Return plain natural-language text only (no JSON, no markdown code fences)."
    )
    user_prompt = (
        f"Customer question: {query}\n\n"
        f"Knowledge snippets:\n{rules_summary}\n\n"
        "Write a concise support reply aligned to the requested tone and emoji density."
    )

    client = AsyncOpenAI(api_key=api_key)
    try:
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        raw_content = completion.choices[0].message.content or ""
        reply = _extract_preview_reply(raw_content)
    except Exception as exc:
        logger.exception("Persona preview generation failed: %s", exc)
        raise HTTPException(status_code=400, detail=f"Preview generation failed: {str(exc)}")

    return {
        "reply": reply,
        "cognitive_flow": ["Searching Knowledge Base", "Applying Tone"],
        "sources_used": len(kb_rules),
    }


@router.post("/verify-deployment", response_model=OnboardingStatus)
async def verify_deployment(
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Deployment verification has been removed. Onboarding now completes at Step 3.",
    )