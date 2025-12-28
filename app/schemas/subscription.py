from datetime import date
from typing import Optional
from uuid import UUID
from sqlmodel import SQLModel

class SubscriptionRead(SQLModel):
    id: int
    user_id: UUID
    status: str
    start_date: Optional[date]
    end_date: Optional[date]

class SubscriptionCreate(SQLModel):
    # Currently empty as subscription logic is minimal (starts today, default plan)
    pass
