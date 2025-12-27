from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date

class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    status: str   # PENDING, ACTIVE, EXPIRED
    start_date: Optional[date]
    end_date: Optional[date]
