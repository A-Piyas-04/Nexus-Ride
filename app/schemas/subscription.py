from sqlmodel import SQLModel
from typing import Optional
from datetime import date
from uuid import UUID

class SubscriptionRead(SQLModel):
    id: int
    user_id: UUID
    status: str
    start_date: Optional[date]
    end_date: Optional[date]

class SubscriptionCreate(SQLModel):
    pass
