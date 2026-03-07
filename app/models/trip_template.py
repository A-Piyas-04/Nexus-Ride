from datetime import date, time
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint


class TripTemplate(SQLModel, table=True):
    __tablename__ = "trip_template"
    __table_args__ = (
        UniqueConstraint(
            "vehicle_id",
            "start_time",
            "direction",
            name="unique_vehicle_schedule"
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_id: UUID = Field(foreign_key="route.id")
    vehicle_id: UUID = Field(foreign_key="vehicle.id")
    driver_profile_id: int = Field(foreign_key="driver_profile.id")
    direction: str
    start_time: time
    is_active: bool = True
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
