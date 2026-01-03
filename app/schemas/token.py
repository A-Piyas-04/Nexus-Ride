from sqlmodel import SQLModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional

class TokenBase(SQLModel):
    route_id: UUID
    travel_date: date
    pickup_stop_id: UUID
    status: str

class TokenCreate(TokenBase):
    user_id: UUID

class TokenRead(TokenBase):
    id: int
    user_id: UUID
    created_at: datetime
