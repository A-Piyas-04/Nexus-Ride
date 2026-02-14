from typing import List, Literal, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field as PydField
from sqlmodel import Session, select

from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.vehicle import Vehicle
from app.models.profile import DriverProfile
from app.models.trip import Trip
from app.schemas.vehicle import VehicleRead

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


# ---------- Role Helpers ----------
def has_role(user: User, role_name: str, session: Session) -> bool:
    statement = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user.id)
        .where(Role.name == role_name)
    )
    return session.exec(statement).first() is not None


def require_transport_officer(user: User, session: Session):
    if user.user_type != "STAFF" or not has_role(user, "TO", session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officers (STAFF with TO role) can perform this action.",
        )


# ---------- Request Models ----------
class VehicleCreateInput(BaseModel):
    vehicle_number: str
    capacity: int


class VehicleStatusUpdate(BaseModel):
    status: Literal["AVAILABLE", "IN_SERVICE", "UNDER_REPAIR"] = PydField(..., description="Vehicle operational status")


class VehiclePartialUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    capacity: Optional[int] = None


# ---------- Queries ----------
def _get_vehicle_or_404(vehicle_id: UUID, session: Session) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


# ---------- GET ----------
@router.get("", response_model=List[VehicleRead])
def list_vehicles(session: Session = Depends(get_session)):
    statement = select(Vehicle).order_by(Vehicle.created_at.desc())
    return session.exec(statement).all()


@router.get("/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: UUID, session: Session = Depends(get_session)):
    return _get_vehicle_or_404(vehicle_id, session)


# ---------- POST ----------
@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: VehicleCreateInput,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    require_transport_officer(current_user, session)

    # Enforce unique vehicle_number
    existing = session.exec(select(Vehicle).where(Vehicle.vehicle_number == data.vehicle_number)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with number '{data.vehicle_number}' already exists",
        )

    vehicle = Vehicle(
        vehicle_number=data.vehicle_number,
        capacity=data.capacity,
        status="AVAILABLE",
    )
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


# ---------- PATCH: Status ----------
@router.patch("/{vehicle_id}/status", response_model=VehicleRead)
def update_vehicle_status(
    vehicle_id: UUID,
    update: VehicleStatusUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    require_transport_officer(current_user, session)

    vehicle = _get_vehicle_or_404(vehicle_id, session)
    vehicle.status = update.status
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


# ---------- PATCH: Number/Capacity ----------
@router.patch("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: UUID,
    update: VehiclePartialUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    require_transport_officer(current_user, session)
    vehicle = _get_vehicle_or_404(vehicle_id, session)

    # Handle vehicle_number uniqueness if updating
    if update.vehicle_number and update.vehicle_number != vehicle.vehicle_number:
        exists = session.exec(select(Vehicle).where(Vehicle.vehicle_number == update.vehicle_number)).first()
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle with number '{update.vehicle_number}' already exists",
            )
        vehicle.vehicle_number = update.vehicle_number

    if update.capacity is not None:
        vehicle.capacity = update.capacity

    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


# ---------- DELETE ----------
@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    require_transport_officer(current_user, session)
    vehicle = _get_vehicle_or_404(vehicle_id, session)

    # Rule 1: Not assigned to active trip (SCHEDULED or STARTED)
    active_trip = session.exec(
        select(Trip).where(Trip.vehicle_id == vehicle_id).where(Trip.status.in_(["SCHEDULED", "STARTED"]))
    ).first()
    if active_trip:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is assigned to an active trip and cannot be deleted",
        )

    # Rule 2: Not currently assigned to a driver
    assigned_driver = session.exec(select(DriverProfile).where(DriverProfile.assigned_vehicle_id == vehicle_id)).first()
    if assigned_driver:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is assigned to a driver and cannot be deleted",
        )

    session.delete(vehicle)
    session.commit()
    return None
