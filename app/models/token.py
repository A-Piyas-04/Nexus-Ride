from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime, date

class Token(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    route_id: UUID = Field(foreign_key="route.id")
    pickup_stop_id: UUID = Field(foreign_key="route_stop.id")
    travel_date: date
    status: str # ACTIVE / CANCELLED / USED
    created_at: datetime = Field(default_factory=datetime.utcnow)
