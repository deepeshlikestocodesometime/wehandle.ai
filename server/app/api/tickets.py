from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.merchant import User
from app.models.ticket import Ticket, Message
from app.api.deps import get_current_user
from app.schemas.ticket import TicketResponse, TicketWithMessagesResponse, MessageCreate, MessageResponse, TicketUpdate

router = APIRouter()

@router.get("", response_model=List[TicketResponse])
async def get_tickets(
    status: str = None, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetches the list of tickets for the Copilot Inbox sidebar."""
    query = select(Ticket).where(Ticket.merchant_id == current_user.merchant_id).order_by(Ticket.updated_at.desc())
    
    if status:
        query = query.where(Ticket.status == status.upper())
        
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{ticket_id}", response_model=TicketWithMessagesResponse)
async def get_ticket_thread(
    ticket_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Loads the full conversation history for the middle column."""
    result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.messages))
        .where(Ticket.id == ticket_id, Ticket.merchant_id == current_user.merchant_id)
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return ticket


@router.post("/{ticket_id}/messages", response_model=MessageResponse)
async def send_manual_reply(
    ticket_id: UUID, 
    data: MessageCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Allows a human agent to reply to a ticket manually."""
    # Verify ticket belongs to merchant
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.merchant_id == current_user.merchant_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    new_message = Message(
        ticket_id=ticket.id,
        sender_type=data.sender_type,
        content=data.content
    )
    
    # Auto-switch to MANUAL ('NEEDS_YOU') if a human replies, or RESOLVED if specified
    ticket.status = "NEEDS_YOU"
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    return new_message


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: UUID, 
    data: TicketUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Allows toggling between AUTOPILOT and MANUAL via the UI toggle."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.merchant_id == current_user.merchant_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.status = data.status.upper()
    await db.commit()
    await db.refresh(ticket)
    
    return ticket