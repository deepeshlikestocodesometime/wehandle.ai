from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

# Import our new routers
from app.api.knowledge import router as knowledge_router
from app.api.tickets import router as tickets_router
from app.api.auth import router as auth_router
from app.api.onboarding import router as onboarding_router

app = FastAPI(
    title="WeHandle.ai API",
    description="Platinum Intelligence Backend for Shopify Plus",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the routers here
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(onboarding_router, prefix="/api/v1/onboarding", tags=["Onboarding Flow"])
app.include_router(tickets_router, prefix="/api/v1/inbox", tags=["Copilot Inbox"])
app.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["Intelligence Hub"])

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