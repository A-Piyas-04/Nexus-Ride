from sqlmodel import SQLModel
from typing import Optional
from datetime import date
from uuid import UUID

class SubscriptionRead(SQLModel):
    id: int
    user_id: UUID
    stop_name: str
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    route_name: Optional[str] = None

class SubscriptionCreate(SQLModel):
    start_month: str
    end_month: str
    year: int
    stop_name: str

class SubscriptionLeaveBase(SQLModel):
    subscription_id: int
    from_date: date
    to_date: date
    reason: Optional[str] = None

class SubscriptionLeaveCreate(SubscriptionLeaveBase):
    pass

class SubscriptionLeaveRead(SubscriptionLeaveBase):
    id: int
