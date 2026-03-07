from datetime import date, time
from typing import Optional
from uuid import UUID

from sqlmodel import SQLModel


class TripTemplateBase(SQLModel):
    route_id: UUID
    vehicle_id: UUID
    driver_profile_id: int
    direction: str
    start_time: time
    is_active: bool = True
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None


class TripTemplateCreate(TripTemplateBase):
    pass


class TripTemplateRead(TripTemplateBase):
    id: UUID


class TripTemplateUpdate(SQLModel):
    route_id: Optional[UUID] = None
    vehicle_id: Optional[UUID] = None
    driver_profile_id: Optional[int] = None
    direction: Optional[str] = None
    start_time: Optional[time] = None
    is_active: Optional[bool] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
