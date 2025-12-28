from typing import Optional
from datetime import date
from sqlmodel import SQLModel

class SubscriptionBase(SQLModel):
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SubscriptionCreate(SQLModel):
    pass

class SubscriptionRead(SubscriptionBase):
    id: int
    user_id: str  # UUID as str
