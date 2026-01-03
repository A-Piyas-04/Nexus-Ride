from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4

class SeatAllocation(SQLModel, table=True):
    __tablename__ = "seat_allocation"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    trip_id: UUID = Field(foreign_key="trip.id")
    user_id: UUID = Field(foreign_key="user.id")
    seat_type: str # SUBSCRIPTION / TOKEN / GUEST
    pickup_stop_id: UUID = Field(foreign_key="route_stop.id")
