from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID

class StaffProfile(SQLModel, table=True):
    __tablename__ = "staff_profile"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    email: Optional[str] = Field(default=None, foreign_key="user.email")
    mobile_number: Optional[str] = Field(default=None, foreign_key="user.mobile_number")
    staff_code: str = Field(unique=True)
    department: str
    default_route_id: Optional[UUID] = Field(default=None, foreign_key="route.id")
    default_pickup_stop_id: Optional[UUID] = Field(default=None, foreign_key="route_stop.id")
    
    # Profile Picture
    profile_picture: Optional[bytes] = Field(default=None)
    profile_picture_mime: Optional[str] = Field(default=None)
    profile_picture_filename: Optional[str] = Field(default=None)

    @property
    def has_profile_picture(self) -> bool:
        return self.profile_picture is not None

    @property
    def has_profile_picture(self) -> bool:
        return self.profile_picture is not None

class DriverProfile(SQLModel, table=True):
    __tablename__ = "driver_profile"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", unique=True)
    email: Optional[str] = Field(default=None, foreign_key="user.email")
    mobile_number: Optional[str] = Field(default=None, foreign_key="user.mobile_number")
    license_number: str
    assigned_vehicle_id: Optional[UUID] = Field(default=None, foreign_key="vehicle.id")
    driver_status: int = Field(default=0)
    
    # Profile Picture
    profile_picture: Optional[bytes] = Field(default=None)
    profile_picture_mime: Optional[str] = Field(default=None)
    profile_picture_filename: Optional[str] = Field(default=None)

    @property
    def has_profile_picture(self) -> bool:
        return self.profile_picture is not None


