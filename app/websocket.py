from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
from models import GameState
import game_logic

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
            game_state = GameState(room=rooms[room_id])
            action = json.loads(data)
            
            if action["type"] == "play_turn":
                try:
                    game_state = game_logic.play_turn(game_state, action["player"], action["action"])
                    rooms[room_id] = game_state.room
                    await manager.broadcast(json.dumps(game_state.dict()), room_id)
                except ValueError as e:
                    await websocket.send_text(json.dumps({"error": str(e)}))
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        print(f"WebSocket disconnected in room {room_id}")
        await manager.broadcast(json.dumps({"type": "player_left"}), room_id)
