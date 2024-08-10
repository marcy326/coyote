import random
import string
from typing import List
from models import Room, Player, GameState, Card

def create_room(room_id: str) -> Room:
    return Room(id=room_id)

def add_player(room: Room, player_name: str, player_id: str) -> Room:
    existing_player = next((p for p in room.players if p.id == player_id), None)
    
    if existing_player:
        existing_player.name = player_name
    else:
        new_player = Player(id=player_id, name=player_name)
        if len(room.players) >= 10:
            raise ValueError("部屋が満員です")
        if any(p.id == player_id for p in room.players):
            raise ValueError("プレイヤーIDが既に存在します")
        room.players.append(new_player)

    return room

def delete_player(room: Room, player_id: str) -> Room:
    room.players = [p for p in room.players if p.id != player_id]
    return room

def create_deck() -> List[Card]:
    deck = []
    # 通常のカード
    for value in range(6):
        deck.extend([Card(value=value)] * 4)
    deck.extend([Card(value=10)] * 3)
    deck.extend([Card(value=15)] * 2)
    deck.append(Card(value=20))
    deck.extend([Card(value=-5)] * 2)
    deck.append(Card(value=-10))
    # 特殊カード
    deck.append(Card(value="x2", effect="multiply"))
    deck.append(Card(value="MAX→0", effect="max_to_zero"))
    deck.append(Card(value="?", effect="random"))
    random.shuffle(deck)
    return deck

def start_game(game_state: GameState) -> GameState:
    if len(game_state.room.players) < 2:
        raise ValueError("ゲームを開始するには最低2人のプレイヤーが必要です")
    
    game_state.room.game_started = True
    game_state.room.game_in_progress = True
    game_state.deck = create_deck()
    
    # 各プレイヤーにカードを配る
    for player in game_state.room.players:
        player.card = game_state.deck.pop()
    game_state.room.top_card = game_state.deck.pop()

    game_state.room.total_value = calculate_total_value(game_state.room)
    game_state.room.last_bid = 0
    game_state.room.current_turn = 0
    print(f"Game started: current_turn = {game_state.room.current_turn}") 
    # ランダムな順番のリストを生成
    order = [i for i in range(len(game_state.room.players))]
    random.shuffle(order)
    game_state.room.random_order = order
    
    
    return game_state

def get_next_turn(room: Room) -> int:
    next_turn = (room.current_turn + 1) % len(room.players)
    return next_turn

def get_previous_turn(room: Room) -> int:
    previous_turn = (room.current_turn - 1) % len(room.players)
    return previous_turn

def calculate_total_value(room: Room) -> int:
    total = 0
    max_value_to_zero = False
    max_value = -10
    multiply = False

    for player in room.players:
        card = player.card
        if card:
            if player.card.value == "?":
                card = room.top_card
            
            if card.value == "x2":
                multiply = True
            elif card.value == "MAX→0":
                max_value_to_zero = True
            elif isinstance(card.value, int):
                total += card.value
                max_value = max(max_value, card.value)

    if max_value_to_zero:
        total -= max_value  # 最大値を0にする

    if multiply:
        total *= 2

    return total

def end_game(game_state: GameState) -> GameState:
    game_state.room.game_started = False
    game_state.room.game_in_progress = False
    # その他のゲーム終了処理
    return game_state

def generate_room_id(length=8):
    """指定された長さのランダムな英数字のroom IDを生成する"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))