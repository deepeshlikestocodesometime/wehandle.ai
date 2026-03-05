from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.core.rate_limiter import RateLimiterMiddleware

# Import our new routers
from app.api.knowledge import router as knowledge_router
from app.api.tickets import router as tickets_router
from app.api.auth import router as auth_router
from app.api.onboarding import router as onboarding_router
from app.api.analytics import router as analytics_router
from app.api.admin import router as admin_router
from app.api.webhooks import router as webhooks_router
from app.api.suggestions import router as suggestions_router
from app.api.team import router as team_router
from app.api.settings import router as settings_router

app = FastAPI(
    title="WeHandle.ai API",
    description="Platinum Intelligence Backend for Shopify Plus",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://wehandlecx.com",
        "https://www.wehandlecx.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimiterMiddleware)

# Connect the routers here
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(onboarding_router, prefix="/api/v1/onboarding", tags=["Onboarding Flow"])
app.include_router(tickets_router, prefix="/api/v1/inbox", tags=["Copilot Inbox"])
app.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["Intelligence Hub"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(webhooks_router, prefix="/api/v1/webhooks", tags=["Webhooks"])
app.include_router(suggestions_router, prefix="/api/v1/suggestions", tags=["Suggestions"])
app.include_router(team_router, prefix="/api/v1/team", tags=["Team"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["Settings"])

@app.get("/")
async def root():
    return {"status": "online", "platform": "WeHandle.ai"}

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}