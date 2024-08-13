from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Response, Depends, Cookie, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from models import Room, Player, GameState
import game_logic
from websocket import websocket_endpoint as ws_endpoint, manager
import json
import uuid
import os
import random

app = FastAPI()

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],  # Reactアプリのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 仮のデータストア（実際のアプリケーションでは適切なデータストアを使用してください）
rooms = {}

@app.post("/health")
def healthcheck():
    return {"message": "healthy"}

@app.post("/room")
async def create_room():
    room_id = game_logic.generate_room_id()
    print(f"Creating room with ID: {room_id}")
    if room_id in rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
    rooms[room_id] = game_logic.create_room(room_id)
    return {"message": "Room created successfully", "room_id": room_id}  # room_idを返す

@app.post("/room/{room_id}/join")
async def join_room(
    room_id: str,
    player_name: str = Query(..., title="Player Name"),  # クエリパラメータとして受け取る
    response: Response = None,
    player_id: str = Cookie(default=None)
):
    print(f"Joining room {room_id} with player {player_name}")  # デバッグ用ログ
    if room_id not in rooms:
        print(f"Room {room_id} does not exist")  # デバッグ用ログ
        raise HTTPException(status_code=404, detail="Room does not exist")
    
    if player_name.strip() == "":
        raise HTTPException(status_code=400, detail="名前は空白だけではいけません")
    if len(player_name) > 20:
        raise HTTPException(status_code=400, detail="名前は20文字以下で入力してください")
    
    # プレイヤーIDがCookieにない場合、新しく生成してCookieに設定
    if not player_id:
        player_id = str(uuid.uuid4())
        response.set_cookie(key="player_id", value=player_id)

    try:
        room = rooms[room_id]
        
        # プレイヤーが再接続する場合、名前を更新する
        room = game_logic.add_player(room, player_name, player_id)
        rooms[room_id] = room

        message = {
            "type": "player_joined",
            "players": [p.dict() for p in room.players],
            "gameInProgress": room.game_in_progress  # ゲーム状態を追加
        }

        print(f"Room {room_id} state: gameInProgress = {room.game_in_progress}")

        # WebSocketを通じて全プレイヤーに更新を通知
        if room_id in manager.active_connections:
            await manager.broadcast(json.dumps(message), room_id)
        else:
            print(f"No active WebSocket connections for room {room_id}")

        return {"message": "Joined room successfully", "gameInProgress": room.game_in_progress, "playerId": player_id}
    except ValueError as e:
        print(f"Error joining room: {str(e)}")  # デバッグ用ログ
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/room/{room_id}/leave")
async def leave_room(room_id: str, player_id: str = Body(..., embed=True)):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="部屋が存在しません")
    if not player_id:
        raise HTTPException(status_code=400, detail="プレイヤーIDが必要です")
    
    room = rooms[room_id]
    player = next((p for p in room.players if p.id == player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail="プレイヤーが見つかりません")
    
    room = game_logic.delete_player(room, player_id)
    rooms[room_id] = room
    
    # WebSocketを通じて全プレイヤーに更新を通知
    await manager.broadcast(json.dumps({"type": "player_left", "players": [p.dict() for p in room.players]}), room_id)
    
    return {"message": "部屋から退出しました"}

@app.post("/room/{room_id}/start_offline")
async def start_game(room_id: str):
    print(f"Received request to start game in room {room_id}")
    if room_id not in rooms:
        print(f"Room {room_id} does not exist")
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    try:
        game_state = game_logic.start_game(game_state)
        rooms[room_id] = game_state.room
        player_ids = [player.id for player in game_state.room.players]
        random.shuffle(player_ids)
        game_state.room.random_order = player_ids
    except ValueError as e:
        print(f"Error starting game: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    print(f"Game started in room {room_id}")
    # WebSocket接続を通じて全プレイヤーに通知
    message = json.dumps({"type": "offlinegame_started", "game_state": game_state.dict(), "random_order": player_ids})
    print(f"Broadcasting message: {message}")
    await manager.broadcast(message, room_id)
    return {"message": "Game started successfully"}

@app.post("/room/{room_id}/start_online")
async def start_online_game(room_id: str):
    print(f"Received request to start online game in room {room_id}")
    if room_id not in rooms:
        print(f"Room {room_id} does not exist")
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    try:
        game_state = game_logic.start_game(game_state)
        rooms[room_id] = game_state.room
    except ValueError as e:
        print(f"Error starting game: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    print(f"Online game started in room {room_id}")
    message = json.dumps({"type": "onlinegame_started", "game_state": game_state.dict()})
    print(f"Broadcasting message: {message}")
    await manager.broadcast(message, room_id)
    return {"message": "Online game started successfully"}

@app.post("/room/{room_id}/bid")
async def place_bid(room_id: str, bid: int = Body(..., embed=True)):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    game_state.room.last_bid = bid
    next_turn = game_logic.get_next_turn(game_state.room)
    game_state.room.current_turn = next_turn
    message = json.dumps({"type": "bid", "biddingNum": bid, "nextTurn": next_turn})
    print(f"Broadcasting message: {message}")  # デバッグ用ログ
    await manager.broadcast(message, room_id)
    return {"message": "Bid placed successfully"}

@app.get("/room/{room_id}/players")
async def get_players(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room does not exist")
    room = rooms[room_id]
    players = [player.dict() for player in room.players]
    return {"players": players, "gameInProgress": room.game_in_progress}

@app.get("/room/{room_id}/cards")
async def get_cards(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    return {"cards": [{"playerName": player.name, "card": player.card.value} for player in game_state.room.players]}

@app.post("/room/{room_id}/coyote")
async def result(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    total_value = game_state.room.total_value
    return {"totalValue": total_value, "topCard": game_state.room.top_card.value}

@app.post("/room/{room_id}/coyote_online")
async def declare_coyote(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    total_value = game_state.room.total_value
    last_bid = game_state.room.last_bid
    if last_bid > total_value:
        result = "success"
        prev_turn = game_logic.get_previous_turn(game_state.room)
        order = game_state.room.random_order
        loser = game_state.room.players[order[prev_turn]].name
    else:
        result = "failure"
        loser = game_state.room.players[game_state.room.current_turn].name
    message = json.dumps({"type": "coyote", "result": result, "totalValue": total_value, "loser": loser})
    await manager.broadcast(message, room_id)
    return {"message": "Coyote declared", "result": result, "totalValue": total_value, "loser": loser}

@app.post("/room/{room_id}/end_game")
async def end_game(room_id: str):
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room does not exist")
    game_state = GameState(room=rooms[room_id])
    game_state.room.game_started = False
    game_state.room.game_in_progress = False
    rooms[room_id] = game_state.room
    await manager.broadcast(json.dumps({"type": "game_ended"}), room_id)
    return {"message": "Game ended successfully"}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await ws_endpoint(websocket, room_id)
