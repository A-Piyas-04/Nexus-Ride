from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional


class TripStopProgress(SQLModel, table=True):
    __tablename__ = "trip_stop_progress"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    trip_id: UUID = Field(foreign_key="trip.id", index=True)
    route_stop_id: UUID = Field(foreign_key="route_stop.id", index=True)

    arrived_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    departed_at: Optional[datetime] = None

