from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date
from uuid import UUID

class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    stop_name: str = Field(foreign_key="route_stop.stop_name", unique=True)
    status: str   # PENDING, ACTIVE, EXPIRED
    start_date: Optional[date]
    end_date: Optional[date]

class SubscriptionLeave(SQLModel, table=True):
    __tablename__ = "subscription_leave"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscription.id")
    from_date: date
    to_date: date
    reason: Optional[str] = None
