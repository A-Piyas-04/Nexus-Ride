from uuid import UUID
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel
from app.models.transport_request import RequestStatus

# Guest Schemas
class GuestBase(BaseModel):
    name: str
    pickup_location: str
    notes: Optional[str] = None

class GuestCreate(GuestBase):
    pass

class GuestRead(GuestBase):
    id: UUID
    request_id: UUID

# Transport Request Schemas
class TransportRequestBase(BaseModel):
    event_title: str
    event_date: date

class TransportRequestCreate(TransportRequestBase):
    guests: List[GuestCreate]

class TransportRequestRead(TransportRequestBase):
    id: UUID
    faculty_user_id: UUID
    status: RequestStatus
    to_reply_message: Optional[str] = None
    assigned_vehicle_id: Optional[UUID] = None
    assigned_driver_profile_id: Optional[int] = None
    assigned_by: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    guests: List[GuestRead] = []

class TransportRequestUpdateStatus(BaseModel):
    status: RequestStatus
    note: Optional[str] = None

class TransportRequestAssign(BaseModel):
    assigned_vehicle_id: Optional[UUID] = None
    assigned_driver_profile_id: Optional[int] = None
    to_reply_message: Optional[str] = None
