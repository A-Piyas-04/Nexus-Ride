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


@router.get("/my-trips")
def get_my_trips(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        # Get driver profile
        statement = select(DriverProfile).where(DriverProfile.user_id == current_user.id)
        driver_profile = session.exec(statement).first()
        if not driver_profile:
            raise HTTPException(status_code=404, detail="Driver profile not found")

        # Get trips
        from app.models.trip import Trip
        from app.models.route import Route
        
        print(f"DEBUG: Driver Profile ID: {driver_profile.id}")
        
        query = select(Trip, Route.route_name).join(Route, Trip.route_id == Route.id).where(Trip.driver_profile_id == driver_profile.id)
        print(f"DEBUG: Query: {query}")
        
        trips = session.exec(query).all()
        print(f"DEBUG: Found {len(trips)} trips")
        
        results = []
        for trip, route_name in trips:
            print(f"DEBUG: Processing trip {trip.id}")
            results.append({
                "id": trip.id,
                "route_name": route_name or "Unknown Route",
                "trip_date": trip.trip_date.isoformat() if trip.trip_date else None,
                "start_time": trip.start_time.isoformat() if trip.start_time else None,
                "status": trip.status,
                "vehicle_id": trip.vehicle_id,
                "direction": trip.direction
            })
            
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR in get_my_trips: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    session.refresh(profile)
    
    assigned_vehicle = None
    if profile.assigned_vehicle_id:
        from app.models.vehicle import Vehicle
        assigned_vehicle = session.get(Vehicle, profile.assigned_vehicle_id)

    return {
        "id": profile.id,
        "user_id": str(profile.user_id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "mobile_number": profile.mobile_number,
        "license_number": profile.license_number,
        "driver_status": profile.driver_status,
        "assigned_vehicle_id": str(profile.assigned_vehicle_id) if profile.assigned_vehicle_id else None,
        "assigned_vehicle_number": assigned_vehicle.vehicle_number if assigned_vehicle else None,
    }


class UpdateDriverProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    mobile_number: Optional[str] = None
    # License number removed as it should not be updatable


@router.put("/profile")
def update_driver_profile(
    data: UpdateDriverProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        profile = session.exec(select(DriverProfile).where(DriverProfile.user_id == current_user.id)).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Driver profile not found")

        if data.full_name is not None:
            current_user.full_name = data.full_name
            session.add(current_user)

        if data.email is not None:
            if data.email:
                email_val = data.email.strip().lower()
                if not email_val.endswith("@iut-dhaka.edu"):
                    raise HTTPException(status_code=400, detail="Email must end with @iut-dhaka.edu")
                existing_email = session.exec(
                    select(User).where(User.email == email_val).where(User.id != current_user.id)
                ).first()
                if existing_email:
                    raise HTTPException(status_code=400, detail="Email already in use")
            current_user.email = data.email.strip().lower() if data.email else None
            session.add(current_user)
            session.flush() # Flush User update first for email FK
            profile.email = current_user.email

        if data.mobile_number is not None:
            mobile_val = data.mobile_number.strip() if data.mobile_number else None
            if mobile_val:
                existing_mobile = session.exec(
                    select(User).where(User.mobile_number == mobile_val).where(User.id != current_user.id)
                ).first()
                if existing_mobile:
                    raise HTTPException(status_code=400, detail="Mobile number already in use")
            
            current_user.mobile_number = mobile_val
            session.add(current_user)
            session.flush() # Flush User update first for mobile FK
            
            profile.mobile_number = mobile_val

        session.add(profile)
        session.commit()
        return {"msg": "Updated successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


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
    session.refresh(profile)
    return {
        "msg": "Approved",
        "driver_profile_id": profile.id,
        "mobile_number": profile.mobile_number,
    }
