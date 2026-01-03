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

class TripAvailabilityRead(TripRead):
    route_name: str
    vehicle_number: str
    total_capacity: int
    booked_seats: int
    available_seats: int
