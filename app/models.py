from pydantic import BaseModel, Field
from typing import List, Optional


class Player(BaseModel):
    id: str
    name: str
    card: Optional[int] = None

class Room(BaseModel):
    id: str
    players: List[Player] = Field(default_factory=list)
    game_started: bool = False
    game_in_progress: bool = False
    total_value: int = 0

class GameState(BaseModel):
    room: Room
    deck: List[int] = Field(default_factory=lambda: list(range(0, 21)))  # カードは0から20まで
    discard_pile: List[int] = Field(default_factory=list)
