from pydantic import BaseModel
from typing import List, Optional

class Player(BaseModel):
    name: str
    score: int = 0
    current_card: Optional[int] = None

class Room(BaseModel):
    id: str
    players: List[Player] = []
    game_started: bool = False
    current_turn: Optional[str] = None

class GameState(BaseModel):
    room: Room
    deck: List[int] = list(range(0, 21))  # カードは0から20まで
    discard_pile: List[int] = []