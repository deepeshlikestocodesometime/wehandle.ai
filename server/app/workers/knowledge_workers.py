import asyncio
import logging
import os
from uuid import UUID

from openai import AsyncOpenAI
from celery import shared_task
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.ai import KnowledgeChunk

logger = logging.getLogger(__name__)


async def _embed_chunk(chunk_id: UUID) -> None:
  async with AsyncSessionLocal() as session:  # type: AsyncSession
    result = await session.execute(select(KnowledgeChunk).where(KnowledgeChunk.id == chunk_id))
    chunk = result.scalar_one_or_none()
    if not chunk:
      logger.warning("Knowledge chunk %s not found for embedding", chunk_id)
      return

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
      logger.warning("OPENAI_API_KEY not configured; skipping embedding for chunk %s", chunk_id)
      return

    client = AsyncOpenAI(api_key=api_key)

    try:
      resp = await client.embeddings.create(
        model="text-embedding-3-small",
        input=chunk.content,
      )
      embedding = resp.data[0].embedding
    except Exception as exc:  # pragma: no cover - network I/O
      logger.exception("Failed to generate embedding for chunk %s: %s", chunk_id, exc)
      return

    chunk.embedding = embedding
    await session.commit()


@shared_task(name="knowledge.process_document_task")
def process_document_task(chunk_id: str) -> None:
  """
  Background task:
  - Loads the KnowledgeChunk by ID
  - Calls OpenAI embeddings
  - Updates the `embedding` column
  """
  try:
    asyncio.run(_embed_chunk(UUID(chunk_id)))
  except Exception as exc:  # pragma: no cover - worker-level failure
    logger.exception("process_document_task failed for %s: %s", chunk_id, exc)

