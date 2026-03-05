from typing import Dict, List
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections keyed by merchant_id.
    """

    def __init__(self) -> None:
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, merchant_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(merchant_id, []).append(websocket)

    def disconnect(self, merchant_id: UUID, websocket: WebSocket) -> None:
        connections = self.active_connections.get(merchant_id)
        if not connections:
            return
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self.active_connections.pop(merchant_id, None)

    async def send_personal_message(self, merchant_id: UUID, message: dict) -> None:
        for connection in self.active_connections.get(merchant_id, []):
            await connection.send_json(message)

    async def broadcast_ticket_update(self, merchant_id: UUID, payload: dict) -> None:
        await self.send_personal_message(merchant_id, payload)


manager = ConnectionManager()

