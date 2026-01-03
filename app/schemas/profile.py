from sqlmodel import SQLModel
from uuid import UUID
from typing import Optional

# Staff Profile Schemas
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

# Driver Profile Schemas
class DriverProfileBase(SQLModel):
    license_number: str
    assigned_vehicle_id: Optional[UUID] = None

class DriverProfileCreate(DriverProfileBase):
    user_id: UUID

class DriverProfileRead(DriverProfileBase):
    id: int
    user_id: UUID
