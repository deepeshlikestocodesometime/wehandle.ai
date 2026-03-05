from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.websocket_manager import manager
from app.models.merchant import User
from app.models.ticket import Ticket, Message
from app.api.deps import get_current_user
from app.schemas.ticket import TicketResponse, TicketWithMessagesResponse, MessageCreate, MessageResponse, TicketUpdate
from app.services.ai_service import generate_omnichannel_reply
from app.services.shopify_service import ShopifyBridge

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


@router.get("/{ticket_id}/context")
async def get_ticket_context(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns Shopify customer context for the Inbox sidebar (Customer Profile + Live Order Context).
    """
    result = await db.execute(
        select(Ticket).where(Ticket.id == ticket_id, Ticket.merchant_id == current_user.merchant_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    bridge = ShopifyBridge(db)
    context = await bridge.get_customer_context(ticket.customer_email, current_user.merchant_id)

    return {
        "shopify_context": context,
        "shopify_shop_url": current_user.merchant.merchant.shopify_shop_url if hasattr(current_user, "merchant") else None,
    }


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

    # Broadcast update to any live dashboards / inbox clients
    await manager.broadcast_ticket_update(
        ticket.merchant_id,
        {
            "type": "message.new",
            "ticketId": str(ticket.id),
            "message": {
                "id": str(new_message.id),
                "sender_type": new_message.sender_type,
                "content": new_message.content,
                "created_at": new_message.created_at.isoformat() if new_message.created_at else "",
                "cognitive_logs": new_message.cognitive_logs,
            },
        },
    )

    return new_message


@router.post("/{ticket_id}/auto-reply", response_model=MessageResponse)
async def trigger_ai_reply(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Triggers the AI omnichannel responder for a ticket.
    The reply is saved as a Message and dispatched through the original channel.
    """
    # Ensure the ticket belongs to the current merchant
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.merchant_id == current_user.merchant_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
      raise HTTPException(status_code=404, detail="Ticket not found")

    message = await generate_omnichannel_reply(ticket_id, db)
    return message


@router.websocket("/ws/{merchant_id}")
async def websocket_endpoint(websocket: WebSocket, merchant_id: UUID):
    """
    WebSocket endpoint for real-time inbox updates per merchant.
    """
    await manager.connect(merchant_id, websocket)
    try:
        while True:
            # We don't expect messages from the client yet, but keep the socket alive.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(merchant_id, websocket)


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