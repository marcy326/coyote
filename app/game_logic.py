import random
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

def start_game(game_state: GameState) -> GameState:
    if len(game_state.room.players) < 2:
        raise ValueError("At least 2 players are required to start the game")
    
    game_state.room.game_started = True
    random.shuffle(game_state.deck)
    game_state.room.current_turn = random.choice(game_state.room.players).name
    
    # 各プレイヤーにカードを配る
    for player in game_state.room.players:
        player.current_card = game_state.deck.pop()
    
    return game_state

def play_turn(game_state: GameState, player_name: str, action: str) -> GameState:
    if game_state.room.current_turn != player_name:
        raise ValueError("It's not your turn")
    
    current_player = next(p for p in game_state.room.players if p.name == player_name)
    
    if action == "draw":
        if not game_state.deck:
            # デッキが空の場合、捨て札をシャッフルしてデッキにする
            game_state.deck = game_state.discard_pile
            game_state.discard_pile = []
            random.shuffle(game_state.deck)
        
        new_card = game_state.deck.pop()
        game_state.discard_pile.append(current_player.current_card)
        current_player.current_card = new_card
    elif action == "pass":
        pass  # パスの場合は何もしない
    else:
        raise ValueError("Invalid action")
    
    # 次のプレイヤーのターンに
    current_index = game_state.room.players.index(current_player)
    next_index = (current_index + 1) % len(game_state.room.players)
    game_state.room.current_turn = game_state.room.players[next_index].name
    
    return game_state
