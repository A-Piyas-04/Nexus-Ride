from sqlmodel import SQLModel
from uuid import UUID
from datetime import datetime

class VehicleBase(SQLModel):
    vehicle_number: str
    capacity: int
    status: str

class VehicleCreate(VehicleBase):
    pass

class VehicleRead(VehicleBase):
    id: UUID
    created_at: datetime
