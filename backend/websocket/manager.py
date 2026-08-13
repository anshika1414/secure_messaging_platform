from typing import Dict, Set
from fastapi import WebSocket
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:

    def __init__(self):
        # Maps user_id -> Set of active WebSocket instances
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket. Total sockets: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")

    def is_user_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_to_user(self, user_id: str, data: dict):
        if user_id in self.active_connections:
            closed_sockets = set()
            payload = json.dumps(data, default=str)
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.error(f"Error sending WS message to user {user_id}: {e}")
                    closed_sockets.add(ws)
            for ws in closed_sockets:
                self.active_connections[user_id].discard(ws)

    async def broadcast_to_users(self, user_ids: list, data: dict, exclude_user_id: str = None):
        for uid in user_ids:
            if exclude_user_id and uid == exclude_user_id:
                continue
            await self.send_to_user(uid, data)

manager = ConnectionManager()
