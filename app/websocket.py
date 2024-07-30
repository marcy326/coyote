from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
from models import GameState, Room
import game_logic
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)
        else:
            print(f"No active WebSocket connections for room {room_id}")

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    print(f"New WebSocket connection in room {room_id}")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message in room {room_id}: {data}")
            action = json.loads(data)
            
            if action["type"] == "show_card":
                print(f"Starting countdown for show_card in room {room_id}")
                await manager.broadcast(json.dumps({"type": "show_card_countdown", "countdown": 5}), room_id)
                for i in range(4, 0, -1):
                    await asyncio.sleep(1)
                    await manager.broadcast(json.dumps({"type": "show_card_countdown", "countdown": i}), room_id)
                await asyncio.sleep(1)
                print(f"Broadcasting show_card in room {room_id}")
                await manager.broadcast(json.dumps({"type": "show_card"}), room_id)
            elif action["type"] == "coyote":
                print(f"Broadcasting coyote in room {room_id}")
                total_value = action["totalValue"]
                print(f"Total value: {total_value}")
                await manager.broadcast(json.dumps({"type": "coyote", "totalValue": total_value}), room_id)
            elif action["type"] == "end_game":
                print(f"Ending game in room {room_id}")
                await manager.broadcast(json.dumps({"type": "game_ended"}), room_id)
            elif action["type"] == "player_left":
                print(f"Player left room {room_id}")
                players = action["players"]
                print(f"Players: {players}")
                await manager.broadcast(json.dumps({"type": "player_left", "players": players}), room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        print(f"WebSocket disconnected in room {room_id}")
        try:
            await manager.broadcast(json.dumps({"type": "player_left"}), room_id)
        except WebSocketDisconnect:
            pass