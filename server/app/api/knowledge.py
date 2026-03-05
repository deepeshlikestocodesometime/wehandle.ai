from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.merchant import User
from app.models.ai import KnowledgeChunk
from app.api.deps import get_current_user
from app.schemas.knowledge import KnowledgeCreate, KnowledgeUpdate, KnowledgeResponse
from app.workers.knowledge_workers import process_document_task

router = APIRouter()

@router.get("", response_model=List[KnowledgeResponse])
async def get_knowledge_base(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetches all rules/documents for the Intelligence Hub sidebar."""
    result = await db.execute(
        select(KnowledgeChunk)
        .where(KnowledgeChunk.merchant_id == current_user.merchant_id)
        .order_by(KnowledgeChunk.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=KnowledgeResponse)
async def add_knowledge(
    data: KnowledgeCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Adds a new manual rule. (Files/Scraping will use background workers)."""
    # 1536 is the dimension size for text-embedding-3-small. 
    # We use a dummy vector until the OpenAI worker is attached.
    dummy_vector = [0.0] * 1536 

    new_chunk = KnowledgeChunk(
        merchant_id=current_user.merchant_id,
        source_type=data.source_type,
        source_name=data.source_name,
        content=data.content,
        embedding=dummy_vector
    )
    db.add(new_chunk)
    await db.commit()
    await db.refresh(new_chunk)

    # Trigger embedding in the background
    process_document_task.delay(str(new_chunk.id))
    return new_chunk


@router.post("/upload", response_model=KnowledgeResponse)
async def upload_knowledge_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Handles PDF/text file uploads from Step 2 (Knowledge Ingestion).
    Extracts raw text and enqueues an embedding task.
    """
    raw_bytes = await file.read()
    try:
        text = raw_bytes.decode("utf-8", errors="ignore")
    except Exception:
        text = ""

    if not text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file did not contain readable text")

    dummy_vector = [0.0] * 1536

    new_chunk = KnowledgeChunk(
        merchant_id=current_user.merchant_id,
        source_type="PDF",
        source_name=file.filename,
        content=text,
        embedding=dummy_vector,
    )
    db.add(new_chunk)
    await db.commit()
    await db.refresh(new_chunk)

    process_document_task.delay(str(new_chunk.id))
    return new_chunk


@router.put("/{chunk_id}", response_model=KnowledgeResponse)
async def update_knowledge(
    chunk_id: UUID, 
    data: KnowledgeUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Allows merchants to edit the text of an existing rule."""
    result = await db.execute(select(KnowledgeChunk).where(KnowledgeChunk.id == chunk_id, KnowledgeChunk.merchant_id == current_user.merchant_id))
    chunk = result.scalar_one_or_none()
    
    if not chunk:
        raise HTTPException(status_code=404, detail="Knowledge chunk not found")
        
    chunk.content = data.content
    
    # NOTE: When the content changes, the background worker needs to re-embed it.
    # We will trigger that Celery task here later.
    
    await db.commit()
    await db.refresh(chunk)
    return chunk


@router.delete("/{chunk_id}")
async def delete_knowledge(
    chunk_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Removes a rule from the AI's brain."""
    result = await db.execute(select(KnowledgeChunk).where(KnowledgeChunk.id == chunk_id, KnowledgeChunk.merchant_id == current_user.merchant_id))
    chunk = result.scalar_one_or_none()
    
    if not chunk:
        raise HTTPException(status_code=404, detail="Knowledge chunk not found")
        
    await db.delete(chunk)
    await db.commit()
    return {"status": "deleted"}