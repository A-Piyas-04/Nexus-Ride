from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

class Vehicle(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    vehicle_number: str = Field(unique=True)
    capacity: int
    status: str # AVAILABLE / IN_SERVICE / UNDER_REPAIR
    created_at: datetime = Field(default_factory=datetime.utcnow)
