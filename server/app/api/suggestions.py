from collections import Counter
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.merchant import User
from app.models.ticket import Ticket
from app.models.ai import KnowledgeChunk
from app.api.deps import get_current_user

router = APIRouter()


@router.get("")
async def get_neural_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simple on-demand neural suggestions:
    - Look at NEEDS_YOU tickets
    - Group by intent
    - For intents with 3+ occurrences and no matching KB content, return suggestions.
    """
    merchant_id = current_user.merchant_id

    result = await db.execute(
        select(Ticket.intent)
        .where(
            Ticket.merchant_id == merchant_id,
            Ticket.status == "NEEDS_YOU",
            Ticket.intent.isnot(None),
        )
    )
    intents: List[str] = [row[0] for row in result if row[0]]

    if not intents:
        return []

    counts = Counter(intents)
    frequent_intents = [intent for intent, c in counts.items() if c >= 3]

    if not frequent_intents:
        return []

    # Load KB content once
    kb_result = await db.execute(
        select(KnowledgeChunk.content).where(KnowledgeChunk.merchant_id == merchant_id)
    )
    kb_text = "\n".join(kb_result.scalars().all()).lower()

    suggestions = []
    for intent in frequent_intents:
        if intent.lower() not in kb_text:
            suggestions.append(
                {
                    "intent": intent,
                    "summary": f"Customers frequently ask about '{intent}'. Consider adding a rule.",
                }
            )

    return suggestions

