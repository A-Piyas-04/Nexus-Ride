from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date
from uuid import UUID

class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    status: str   # PENDING, ACTIVE, EXPIRED
    start_date: Optional[date]
    end_date: Optional[date]
