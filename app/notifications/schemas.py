from app.schemas.notification import NotificationBase, NotificationCreate, NotificationRead
from typing import List
from pydantic import BaseModel

NotificationResponse = NotificationRead

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    count: int
