from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class KnowledgeCreate(BaseModel):
    source_type: str = "Manual" # 'PDF', 'Website', or 'Manual'
    source_name: str
    content: str

class KnowledgeUpdate(BaseModel):
    content: str

class KnowledgeResponse(BaseModel):
    id: UUID
    source_type: str
    source_name: str
    content: str
    reference_count: int
    updated_at: datetime

    class Config:
        from_attributes = True