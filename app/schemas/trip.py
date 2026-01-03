from sqlmodel import SQLModel
from uuid import UUID
from datetime import date, time

class TripBase(SQLModel):
    vehicle_id: UUID
    driver_profile_id: int
    route_id: UUID
    trip_date: date
    start_time: time
    status: str

class TripCreate(TripBase):
    pass

class TripRead(TripBase):
    id: UUID
