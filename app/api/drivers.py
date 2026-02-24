from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field as PydField
from typing import List, Optional
from uuid import UUID

from sqlmodel import Session, select

from app.db.session import get_session
from app.models.user import User
from app.models.profile import DriverProfile
from app.core.security import get_current_user


router = APIRouter(prefix="/drivers", tags=["drivers"])


class DriverStatusUpdate(BaseModel):
    status: int = PydField(..., ge=0, le=1)


class DriverSummary(BaseModel):
    id: int
    user_id: UUID
    full_name: str
    email: Optional[str] = None
    mobile_number: Optional[str] = None
    license_number: str
    driver_status: int
    assigned_vehicle_id: Optional[UUID] = None


def _serialize_driver(profile: DriverProfile, user: User) -> dict:
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": user.full_name,
        "email": profile.email or user.email,
        "mobile_number": profile.mobile_number,
        "license_number": profile.license_number,
        "driver_status": profile.driver_status,
        "assigned_vehicle_id": profile.assigned_vehicle_id,
    }


@router.get("", response_model=List[DriverSummary])
def list_drivers(session: Session = Depends(get_session)):
    results = session.exec(
        select(DriverProfile, User).join(User, DriverProfile.user_id == User.id)
    ).all()
    return [DriverSummary(**_serialize_driver(profile, user)) for profile, user in results]


@router.get("/requests")
def driver_requests(session: Session = Depends(get_session)):
    results = session.exec(
        select(DriverProfile, User)
        .join(User, DriverProfile.user_id == User.id)
        .where(DriverProfile.driver_status == 0)
    ).all()
    response = []
    for profile, user in results:
        response.append(
            {
                "id": profile.id,
                "user_id": str(profile.user_id),
                "full_name": user.full_name,
                "mobile_number": profile.mobile_number,
                "license_number": profile.license_number,
            }
        )
    return response

@router.get("/me")
def me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    profile = session.exec(select(DriverProfile).where(DriverProfile.user_id == current_user.id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": profile.id,
        "user_id": str(profile.user_id),
        "mobile_number": profile.mobile_number,
        "license_number": profile.license_number,
        "driver_status": profile.driver_status,
        "assigned_vehicle_id": str(profile.assigned_vehicle_id) if profile.assigned_vehicle_id else None,
    }


@router.get("/{driver_id}", response_model=DriverSummary)
def get_driver(driver_id: int, session: Session = Depends(get_session)):
    result = session.exec(
        select(DriverProfile, User)
        .join(User, DriverProfile.user_id == User.id)
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Driver not found")
    profile, user = result
    return DriverSummary(**_serialize_driver(profile, user))


@router.patch("/{driver_id}/status", response_model=DriverSummary)
def update_driver_status(
    driver_id: int,
    update: DriverStatusUpdate,
    session: Session = Depends(get_session),
):
    profile = session.exec(select(DriverProfile).where(DriverProfile.id == driver_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
    profile.driver_status = update.status
    session.add(profile)
    session.commit()
    user = session.exec(select(User).where(User.id == profile.user_id)).first()
    return DriverSummary(**_serialize_driver(profile, user))

@router.put("/{id}/approve")
def approve_driver(id: int, session: Session = Depends(get_session)):
    profile = session.exec(select(DriverProfile).where(DriverProfile.id == id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Not found")
    profile.driver_status = 1
    session.add(profile)
    session.commit()
    return {"msg": "Approved"}
