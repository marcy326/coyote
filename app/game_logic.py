import random
import string
from models import Room, Player, GameState

def create_room(room_id: str) -> Room:
    return Room(id=room_id)

def add_player(room: Room, player_name: str, player_id: str) -> Room:
    existing_player = next((p for p in room.players if p.id == player_id), None)
    
    if existing_player:
        # 既存のプレイヤーが存在する場合、名前を更新
        existing_player.name = player_name
    else:
        # 新しいプレイヤーを追加
        new_player = Player(id=player_id, name=player_name)
        if len(room.players) >= 10:
            raise ValueError("Room is full")
        if any(p.id == player_id for p in room.players):
            raise ValueError("Player ID already exists")
        room.players.append(new_player)

    return room

def delete_player(room: Room, player_id: str) -> Room:
    room.players = [p for p in room.players if p.id != player_id]
    return room

def start_game(game_state: GameState) -> GameState:
    if len(game_state.room.players) < 2:
        raise ValueError("At least 2 players are required to start the game")
    
    game_state.room.game_started = True
    game_state.room.game_in_progress = True
    random.shuffle(game_state.deck)
    
    # 各プレイヤーにカードを配る
    for player in game_state.room.players:
        player.card = game_state.deck.pop()

    game_state.room.total_value = sum(player.card for player in game_state.room.players if player.card is not None)
    
    return game_state

def end_game(game_state: GameState) -> GameState:
    game_state.room.game_started = False
    game_state.room.game_in_progress = False  # この行を追加
    # ... その他のゲーム終了処理 ...
    
    return game_state

def generate_room_id(length=8):
    """指定された長さのランダムな英数字のroom IDを生成する"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))
