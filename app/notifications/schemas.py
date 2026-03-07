from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    event_type: str
    reference_type: str
    reference_id: Optional[UUID] = None

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationResponse(NotificationBase):
    id: UUID
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Alias for backward compatibility if needed, but NotificationResponse is preferred
NotificationRead = NotificationResponse

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    count: int
