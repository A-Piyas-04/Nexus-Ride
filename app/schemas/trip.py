from sqlmodel import SQLModel
from uuid import UUID
from datetime import date, time, datetime
from typing import Optional



class TripBase(SQLModel):
    vehicle_id: UUID
    driver_profile_id: int
    route_id: UUID
    direction: str   # ✅ Added
    trip_date: date
    start_time: time


class TripCreate(TripBase):
    pass


class TripRead(TripBase):
    id: UUID
    status: str
    started_at: Optional[datetime] = None


class TripAvailabilityRead(TripRead):
    route_name: str
    vehicle_number: str
    driver_name: str
    total_capacity: int
    booked_seats: int
    available_seats: int


class TripForDriverRead(TripRead):
    """Trip with route_name for driver 'my trips' list."""
    route_name: str


class TripPassengerRead(SQLModel):
    """Single passenger row for driver trip passenger list."""
    user_id: UUID
    full_name: str
    email: Optional[str] = None
    seat_type: str  # SUBSCRIPTION | TOKEN | GUEST
    pickup_stop_name: str


class TripStopProgressRead(SQLModel):
    route_stop_id: UUID
    stop_name: str
    arrived_at: datetime
    departed_at: Optional[datetime] = None


class TripTrackingRead(SQLModel):
    trip_id: UUID
    route_name: str
    direction: str
    trip_date: date
    start_time: time
    started_at: Optional[datetime] = None
    last_event_type: str  # started | arrived | departed
    last_stop_name: Optional[str] = None
    last_event_at: Optional[datetime] = None
    next_stop_name: Optional[str] = None
