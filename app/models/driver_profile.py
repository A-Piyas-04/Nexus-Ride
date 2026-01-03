from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID

class DriverProfile(SQLModel, table=True):
    __tablename__ = "driver_profile"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    license_number: str
    assigned_vehicle_id: Optional[UUID] = Field(default=None, foreign_key="vehicle.id")
