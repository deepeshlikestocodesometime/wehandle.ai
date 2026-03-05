import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import httpx
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.merchant import Merchant, User
from app.models.ai import Persona, KnowledgeChunk
from app.api.deps import get_current_user
from app.schemas.onboarding import StoreConnect, PersonaUpdate, OnboardingStatus, ShopifyAuthRedirect, VerifyDeploymentRequest

router = APIRouter()


def _canonicalize_shop_domain(raw_domain: str) -> str:
    raw = raw_domain.strip().lower()
    if raw.endswith(".myshopify.com"):
        return raw
    return f"{raw}.myshopify.com"


@router.post("/step1/connect", response_model=ShopifyAuthRedirect)
async def connect_store(
    data: StoreConnect,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiates the Shopify OAuth handshake for Step 1."""
    merchant = current_user.merchant
    if not merchant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Merchant not found for user")

    shop_domain = _canonicalize_shop_domain(data.store_domain)

    client_id = os.getenv("SHOPIFY_API_KEY")
    app_url = os.getenv("SHOPIFY_APP_URL")
    scopes = os.getenv("SHOPIFY_SCOPES", "")

    # If Shopify creds are missing, short-circuit for local testing:
    # just persist the domain and advance onboarding to step 2.
    if not client_id or not app_url:
        merchant.store_domain = shop_domain
        merchant.onboarding_step = 2
        await db.commit()
        # Return a dummy authorization_url so the client code can proceed without redirecting.
        return {"authorization_url": None}

    redirect_uri = app_url.rstrip("/") + "/api/v1/onboarding/shopify/callback"

    # CSRF protection: state is a signed JWT embedding user + merchant context
    state_payload = {"sub": str(current_user.id), "merchant_id": str(merchant.id), "shop": shop_domain}
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

    # Return the full URL including query string
    from urllib.parse import urlencode

    return {"authorization_url": f"{authorization_url}?{urlencode(params)}"}

@router.get("/shopify/callback")
async def shopify_callback(
    code: str,
    shop: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Shopify redirects here after the merchant approves the app."""
    try:
        payload = jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        merchant_id = payload.get("merchant_id")
        expected_shop = payload.get("shop")
        if not user_id or not merchant_id:
            raise JWTError("Missing context in state token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    # Load the user + merchant context
    result = await db.execute(
        select(User)
        .options(selectinload(User.merchant))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or not user.merchant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Merchant context not found")

    merchant = user.merchant

    # Basic safety check that the shop matches the state payload
    shop_domain = shop.lower()
    if expected_shop and expected_shop != shop_domain:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop mismatch")

    api_key = os.getenv("SHOPIFY_API_KEY")
    api_secret = os.getenv("SHOPIFY_API_SECRET")
    app_url = os.getenv("SHOPIFY_APP_URL")

    if not api_key or not api_secret or not app_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Shopify app not configured")

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
    merchant.shopify_access_token = access_token
    merchant.shopify_shop_url = f"https://{shop_domain}"
    merchant.shopify_scopes = scopes
    merchant.store_domain = shop_domain
    merchant.onboarding_step = 2
    await db.commit()

    # Redirect the merchant back into the onboarding flow
    redirect_frontend = app_url.rstrip("/") + "/step-2"
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
    merchant.onboarding_step = 4
    
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}

@router.post("/step4/deploy", response_model=OnboardingStatus)
async def finish_deployment(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    merchant = current_user.merchant
    merchant.onboarding_step = 5 # 5 means LIVE/COMPLETED
    await db.commit()
    return {"onboarding_step": merchant.onboarding_step}


@router.post("/verify-deployment", response_model=OnboardingStatus)
async def verify_deployment(
    data: VerifyDeploymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifies that the storefront has the WeHandle script installed.
    """
    merchant = current_user.merchant
    if not merchant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Merchant not found for user")

    # Prefer explicit shop_url from request; fall back to the stored Shopify shop URL.
    shop_url = (data.shop_url or merchant.shopify_shop_url or "").strip()
    if not shop_url:
        raise HTTPException(status_code=400, detail="No shop URL available for verification")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(shop_url)
            resp.raise_for_status()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to reach storefront URL for verification")

    html = resp.text

    if "wehandle.ai/core.js" not in html or "window.WH_ID" not in html:
        raise HTTPException(
            status_code=400,
            detail="WeHandle script not detected. Ensure you pasted the snippet before </body> and try again.",
        )

    merchant.onboarding_step = 5
    await db.commit()

    return {"onboarding_step": merchant.onboarding_step}