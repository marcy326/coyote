from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models import Room, Player, GameState
import game_logic
from websocket import websocket_endpoint
import json


app = FastAPI()

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Reactアプリのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 仮のデータストア（実際のアプリケーションでは適切なデータストアを使用してください）
rooms = {}

@app.post("/room")
async def create_room(room_id: str):
    if room_id in rooms:
        return {"error": "Room already exists"}
    rooms[room_id] = game_logic.create_room(room_id)
    return {"message": "Room created successfully"}

@app.post("/room/{room_id}/join")
async def join_room(room_id: str, player_name: str):
    print(f"Joining room {room_id} with player {player_name}")  # デバッグ用ログ
    if room_id not in rooms:
        return {"error": "Room does not exist"}
    try:
        rooms[room_id] = game_logic.add_player(rooms[room_id], player_name)
        print(f"Players in room {room_id}: {[p.name for p in rooms[room_id].players]}")  # デバッグ用ログ
        # WebSocketを通じて全プレイヤーに更新を通知
        await manager.broadcast(json.dumps({"type": "player_joined", "players": [p.dict() for p in rooms[room_id].players]}), room_id)
        return {"message": "Joined room successfully"}
    except ValueError as e:
        return {"error": str(e)}

@app.post("/room/{room_id}/start")
async def start_game(room_id: str):
    print(f"Received request to start game in room {room_id}")
    if room_id not in rooms:
        print(f"Room {room_id} does not exist")
        return {"error": "Room does not exist"}
    game_state = GameState(room=rooms[room_id])
    try:
        game_state = game_logic.start_game(game_state)
    except ValueError as e:
        print(f"Error starting game: {str(e)}")
        return {"error": str(e)}
    rooms[room_id] = game_state.room
    print(f"Game started in room {room_id}")
    # WebSocket接続を通じて全プレイヤーに通知
    message = json.dumps({"type": "game_started", "game_state": game_state.dict()})
    print(f"Broadcasting message: {message}")
    await manager.broadcast(message, room_id)
    return {"message": "Game started successfully"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket_endpoint(websocket, room_id)
