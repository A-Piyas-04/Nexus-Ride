from sqlmodel import SQLModel
from datetime import date
from uuid import UUID

class SubscriptionPickupOverrideCreate(SQLModel):
    pickup_stop_id: UUID

class SubscriptionPickupOverrideRead(SQLModel):
    pickup_stop_id: UUID
    stop_name: str
    is_override: bool
    date: date
