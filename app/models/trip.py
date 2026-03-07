from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint
from typing import Optional
from uuid import UUID, uuid4
from datetime import date, time


class Trip(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "route_id", "trip_date", "start_time", "direction",
            name="uq_trip_route_date_time_direction",
        ),
    )
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    vehicle_id: UUID = Field(foreign_key="vehicle.id")
    driver_profile_id: int = Field(foreign_key="driver_profile.id")
    route_id: UUID = Field(foreign_key="route.id")
    direction: str
    trip_date: date
    start_time: time
    status: str # SCHEDULED / STARTED / COMPLETED
