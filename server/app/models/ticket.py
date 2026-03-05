import enum
from sqlalchemy import Column, String, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from .base import BaseModel


class Channel(str, enum.Enum):
    EMAIL = "EMAIL"
    WIDGET = "WIDGET"
    WHATSAPP = "WHATSAPP"
    INSTAGRAM = "INSTAGRAM"

class Ticket(BaseModel):
    __tablename__ = "tickets"

    merchant_id = Column(ForeignKey("merchants.id"), index=True)

    # --- ORIGIN CHANNEL (Omnichannel Router) ---
    channel = Column(Enum(Channel), nullable=False, default=Channel.EMAIL)
    
    # --- CUSTOMER CONTEXT (Maps to Inbox Sidebar) ---
    customer_email = Column(String, index=True)
    customer_name = Column(String, nullable=True)
    shopify_order_id = Column(String, nullable=True) # Links to Shopify Admin API
    
    # --- STATUS TRACKING ---
    status = Column(String, default="AUTOPILOT") # Options: 'AUTOPILOT', 'NEEDS_YOU', 'RESOLVED'
    intent = Column(String, nullable=True)       # e.g., 'ORDER_STATUS', 'REFUND', 'POLICY'
    
    messages = relationship("Message", back_populates="ticket", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(BaseModel):
    __tablename__ = "messages"

    ticket_id = Column(ForeignKey("tickets.id"), index=True)
    
    # --- MESSAGE DETAILS ---
    sender_type = Column(String) # Options: 'CUSTOMER', 'AI', 'HUMAN'
    content = Column(String, nullable=False)
    
    # --- AI REASONING ---
    # Stores the "Cognitive Flow" shown in UI (e.g., "Detected intent: Refund")
    cognitive_logs = Column(JSONB, nullable=True) 

    ticket = relationship("Ticket", back_populates="messages")