import asyncio
import logging
import os
from email.message import EmailMessage
from typing import Optional

import aiosmtplib
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket

logger = logging.getLogger(__name__)


async def _send_email_response(ticket: Ticket, body: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL")

    if not smtp_host or not from_email:
        logger.warning("SMTP not configured; skipping email send")
        return

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = ticket.customer_email
    msg["Subject"] = f"Re: Your support request ({ticket.id})"
    msg.set_content(body)

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True,
        )
    except Exception as exc:  # pragma: no cover - network-specific
        logger.exception("Failed to send email response: %s", exc)


async def _send_widget_response(ticket: Ticket, body: str) -> None:
    """
    Placeholder for pushing responses over WebSockets to the storefront widget.

    In production this would integrate with a FastAPI WebSocket manager or
    a dedicated real-time gateway.
    """
    logger.info("Widget response for ticket %s: %s", ticket.id, body)


async def _send_meta_response(ticket: Ticket, body: str) -> None:
    """
    Placeholder for Meta (WhatsApp / Instagram) delivery using the Meta Graph API.
    """
    logger.info("Meta response for ticket %s via channel %s: %s", ticket.id, ticket.channel, body)


async def dispatch_response(db: AsyncSession, ticket: Ticket, body: str) -> None:
    """
    Sends the AI reply back through the exact same channel the query arrived on.
    """
    channel = getattr(ticket, "channel", None)
    if channel is None:
        logger.warning("Ticket %s has no channel; skipping transport dispatch", ticket.id)
        return

    # Fan out to the appropriate transport
    if channel.value == "EMAIL":
        await _send_email_response(ticket, body)
    elif channel.value == "WIDGET":
        await _send_widget_response(ticket, body)
    elif channel.value in ("WHATSAPP", "INSTAGRAM"):
        await _send_meta_response(ticket, body)
    else:
        logger.warning("Unsupported channel %s for ticket %s", channel, ticket.id)

