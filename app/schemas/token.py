from sqlmodel import SQLModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional

class TokenCreate(SQLModel):
    route_id: UUID
    pickup_stop_id: UUID
    travel_date: date
    consumer_email: Optional[str] = None
    direction: str


class TokenRead(SQLModel):
    id: int
    user_id: UUID
    route_id: UUID
    pickup_stop_id: UUID
    travel_date: date
    status: str
    consumer_email: Optional[str]
    created_at: datetime
