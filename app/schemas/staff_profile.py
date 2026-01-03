from sqlmodel import SQLModel
from uuid import UUID
from typing import Optional

class StaffProfileBase(SQLModel):
    staff_code: str
    department: str
    default_route_id: Optional[UUID] = None
    default_pickup_stop_id: Optional[UUID] = None

class StaffProfileCreate(StaffProfileBase):
    user_id: UUID

class StaffProfileRead(StaffProfileBase):
    id: int
    user_id: UUID
