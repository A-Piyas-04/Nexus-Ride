from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID
from sqlalchemy import UniqueConstraint

class SubscriptionPickupOverride(SQLModel, table=True):
    __tablename__ = "subscription_pickup_override"
    __table_args__ = (
        UniqueConstraint("subscription_id", "date", name="unique_subscription_override_per_day"),
    )

    id: UUID = Field(default_factory=UUID, primary_key=True)
    subscription_id: int = Field(foreign_key="subscription.id")
    date: date
    pickup_stop_id: UUID = Field(foreign_key="route_stop.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
