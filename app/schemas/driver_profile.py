from sqlmodel import SQLModel
from uuid import UUID
from typing import Optional

class DriverProfileBase(SQLModel):
    license_number: str
    assigned_vehicle_id: Optional[UUID] = None

class DriverProfileCreate(DriverProfileBase):
    user_id: UUID

class DriverProfileRead(DriverProfileBase):
    id: int
    user_id: UUID
