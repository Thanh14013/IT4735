from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from typing import List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
            
        logger.info(f"Broadcasting to {len(self.active_connections)} clients")
        
        json_compatible_message = jsonable_encoder(message)

        # Iterate over a copy of the list to avoid modification issues during iteration
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(json_compatible_message)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                self.disconnect(connection)

# Global instance
manager = ConnectionManager()
