from datetime import date, time
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class ScheduleOverride(SQLModel, table=True):
    __tablename__ = "schedule_override"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_id: UUID = Field(foreign_key="route.id")
    date: date
    new_start_time: Optional[time] = None
    is_cancelled: bool = False
