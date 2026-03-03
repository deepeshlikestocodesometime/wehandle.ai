from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.merchant import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/pulse")
async def get_pulse_stats(current_user: User = Depends(get_current_user)):
    """Returns the monolith card data for 'The Pulse'"""
    # NOTE: In a real scenario, we would run SQL aggregations here.
    # For now, returning structured data that matches your UI requirements.
    return {
        "moneySaved": 450,
        "ticketsResolved": 124,
        "avgResponseTime": 8,
        "csatScore": 4.8,
        "resolutionRate": 82
    }

@router.get("/feed")
async def get_neural_feed(current_user: User = Depends(get_current_user)):
    """Returns the 'Neural Feed' list"""
    return [
        {
            "id": "1",
            "summary": "Where is my order #8821?",
            "customer": "Emma W.",
            "type": "ORDER_STATUS",
            "status": "resolved_ai",
            "time": "2 mins ago"
        },
        {
            "id": "2",
            "summary": "Item arrived damaged",
            "customer": "John D.",
            "type": "REFUND",
            "status": "manual",
            "time": "15 mins ago"
        }
    ]