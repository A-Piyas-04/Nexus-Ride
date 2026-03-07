from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

class Notification(SQLModel, table=True):
    __tablename__ = "notification_v2" # Avoid conflict with existing 'notification' table if needed, or replace it. 
    # But wait, SQLModel creates table based on class name usually or __tablename__.
    # The existing model in app/models/notification.py has __tablename__ implicitly "notification".
    # I should probably use a different table name to avoid migration conflicts if I can't touch existing code.
    # The prompt says "Do NOT modify any existing feature modules". 
    # But it also says "Create SQLAlchemy model: Notification".
    # If I use the same table name, Alembic might get confused or I need to migrate.
    # I will use "notification_module" or similar to be safe, or just "notification" and assume this is the evolution.
    # Given "Do NOT modify...", I'll use a distinct table name to be safe: "notifications".
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    event_type: str = Field(index=True)
    title: str
    message: str
    reference_type: str
    reference_id: Optional[UUID] = Field(default=None)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
