from sqlmodel import SQLModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class NotificationBase(SQLModel):
    title: str
    message: str
    event_type: str
    reference_type: str
    reference_id: Optional[str] = None
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationRead(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
