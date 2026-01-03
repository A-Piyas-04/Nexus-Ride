from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import date, time

class Trip(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    vehicle_id: UUID = Field(foreign_key="vehicle.id")
    driver_profile_id: int = Field(foreign_key="driver_profile.id")
    route_id: UUID = Field(foreign_key="route.id")
    trip_date: date
    start_time: time
    status: str # SCHEDULED / STARTED / COMPLETED
