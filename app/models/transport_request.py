from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import date, datetime
from typing import Optional, List
from enum import Enum

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"
    ASSIGNED = "ASSIGNED"
    COMPLETED = "COMPLETED"

class TransportRequest(SQLModel, table=True):
    __tablename__ = "transport_request"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    faculty_user_id: UUID = Field(foreign_key="user.id", index=True)
    event_title: str
    event_date: date
    # Status: PENDING, APPROVED, DECLINED, ASSIGNED, COMPLETED
    status: RequestStatus = Field(default=RequestStatus.PENDING, index=True)
    to_reply_message: Optional[str] = Field(default=None)
    
    # Assignment fields (TO Side Integration)
    assigned_vehicle_id: Optional[UUID] = Field(default=None, foreign_key="vehicle.id")
    assigned_driver_profile_id: Optional[int] = Field(default=None, foreign_key="driver_profile.id")
    assigned_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    assigned_at: Optional[datetime] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    guests: List["Guest"] = Relationship(back_populates="request", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Guest(SQLModel, table=True):
    __tablename__ = "guest"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    request_id: UUID = Field(foreign_key="transport_request.id", ondelete="CASCADE")
    name: str
    pickup_location: str
    notes: Optional[str] = Field(default=None)

    request: Optional[TransportRequest] = Relationship(back_populates="guests")

class TransportRequestStatusLog(SQLModel, table=True):
    __tablename__ = "transport_request_status_log"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    request_id: UUID = Field(foreign_key="transport_request.id")
    previous_status: Optional[str] = Field(default=None)
    new_status: str
    changed_by: UUID = Field(foreign_key="user.id")
    note: Optional[str] = Field(default=None)
    changed_at: datetime = Field(default_factory=datetime.utcnow)
