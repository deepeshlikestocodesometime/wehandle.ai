from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class MessageCreate(BaseModel):
    content: str
    sender_type: str = "HUMAN" # HUMAN or AI

class MessageResponse(BaseModel):
    id: UUID
    sender_type: str
    content: str
    cognitive_logs: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    status: str # 'AUTOPILOT', 'NEEDS_YOU', 'RESOLVED'

class TicketResponse(BaseModel):
    id: UUID
    customer_email: str
    customer_name: Optional[str] = None
    shopify_order_id: Optional[str] = None
    status: str
    intent: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TicketWithMessagesResponse(TicketResponse):
    messages: List[MessageResponse] =[]