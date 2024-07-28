from pydantic import BaseModel, Field
from typing import List, Optional


class Player(BaseModel):
    id: str
    name: str
    score: int = Field(default=0)
    current_card: Optional[int] = None

class Room(BaseModel):
    id: str
    players: List[Player] = Field(default_factory=list)
    game_started: bool = False
    current_turn: Optional[str] = None

class GameState(BaseModel):
    room: Room
    deck: List[int] = Field(default_factory=lambda: list(range(0, 21)))  # カードは0から20まで
    discard_pile: List[int] = Field(default_factory=list)
