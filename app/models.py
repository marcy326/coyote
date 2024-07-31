from pydantic import BaseModel, Field
from typing import List, Optional, Union

class Card(BaseModel):
    value: Union[int, str]
    effect: Optional[str] = None

class Player(BaseModel):
    id: str
    name: str
    card: Optional[Card] = None

class Room(BaseModel):
    id: str
    players: List[Player] = Field(default_factory=list)
    top_card: Optional[Card] = None
    game_started: bool = False
    game_in_progress: bool = False
    total_value: int = 0

class GameState(BaseModel):
    room: Room
    deck: List[Card] = Field(default_factory=list)
    discard_pile: List[int] = Field(default_factory=list)
