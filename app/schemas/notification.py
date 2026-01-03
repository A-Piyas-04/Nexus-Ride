from sqlmodel import SQLModel
from uuid import UUID
from datetime import datetime

class NotificationBase(SQLModel):
    message: str
    is_read: bool = False

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationRead(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
