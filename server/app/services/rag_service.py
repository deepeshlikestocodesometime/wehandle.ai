import os
from typing import List
from uuid import UUID

import openai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.ai import KnowledgeChunk


async def get_relevant_context(
    db: AsyncSession,
    query: str,
    merchant_id: UUID,
    top_k: int = 3,
) -> List[KnowledgeChunk]:
    """
    RAG retriever:
    - Generates an embedding for the incoming customer query
    - Performs a vector similarity search in pgvector filtered by merchant_id
    - Returns the top-K most relevant KnowledgeChunk rows
    - Increments reference_count for each retrieved chunk
    """
    if not query.strip():
        return []

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return []

    openai.api_key = api_key

    try:
        resp = openai.Embedding.create(
            model="text-embedding-3-small",
            input=query,
        )
        query_embedding = resp["data"][0]["embedding"]
    except Exception:
        # If embeddings fail, gracefully fall back to no RAG context
        return []

    # Vector similarity search using pgvector's L2 distance helper
    stmt = (
        select(KnowledgeChunk)
        .where(KnowledgeChunk.merchant_id == merchant_id)
        .order_by(KnowledgeChunk.embedding.l2_distance(query_embedding))
        .limit(top_k)
    )
    result = await db.execute(stmt)
    chunks: List[KnowledgeChunk] = list(result.scalars().all())

    if not chunks:
        return []

    # Increment AI Reference Count for analytics/UI
    for chunk in chunks:
        chunk.reference_count = (chunk.reference_count or 0) + 1

    await db.commit()

    return chunks

