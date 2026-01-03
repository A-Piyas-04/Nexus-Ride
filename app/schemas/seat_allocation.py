from sqlmodel import SQLModel
from uuid import UUID

class SeatAllocationBase(SQLModel):
    trip_id: UUID
    user_id: UUID
    seat_type: str
    pickup_stop_id: UUID

class SeatAllocationCreate(SeatAllocationBase):
    pass

class SeatAllocationRead(SeatAllocationBase):
    id: UUID
