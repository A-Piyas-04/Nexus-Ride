from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import date, datetime
from typing import Optional

class TransportRequest(SQLModel, table=True):
    __tablename__ = "transport_request"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    faculty_user_id: UUID = Field(foreign_key="user.id")
    event_title: str
    event_date: date
    # Status: PENDING, APPROVED, DECLINED, ASSIGNED, COMPLETED
    status: str = Field(default="PENDING")
    to_reply_message: Optional[str] = Field(default=None)
    
    # Assignment fields (TO Side Integration)
    assigned_vehicle_id: Optional[UUID] = Field(default=None, foreign_key="vehicle.id")
    assigned_driver_profile_id: Optional[int] = Field(default=None, foreign_key="driver_profile.id")
    assigned_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    assigned_at: Optional[datetime] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Guest(SQLModel, table=True):
    __tablename__ = "guest"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    request_id: UUID = Field(foreign_key="transport_request.id")
    name: str
    pickup_location: str
    notes: Optional[str] = Field(default=None)

class TransportRequestStatusLog(SQLModel, table=True):
    __tablename__ = "transport_request_status_log"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    request_id: UUID = Field(foreign_key="transport_request.id")
    previous_status: Optional[str] = Field(default=None)
    new_status: str
    changed_by: UUID = Field(foreign_key="user.id")
    note: Optional[str] = Field(default=None)
    changed_at: datetime = Field(default_factory=datetime.utcnow)
