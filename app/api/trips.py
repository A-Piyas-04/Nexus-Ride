from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import date
from uuid import UUID

from app.db.session import get_session
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.route import Route
from app.models.profile import DriverProfile
from app.models.seat_allocation import SeatAllocation
from app.schemas.trip import TripAvailabilityRead
from app.models.role import Role, UserRole
from app.schemas.trip import TripCreate, TripRead
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

VALID_TRIP_TRANSITIONS = {
    "SCHEDULED": ["STARTED"],
    "STARTED": ["COMPLETED"],
    "COMPLETED": []
}

@router.get("/availability", response_model=list[TripAvailabilityRead])
def get_trips_availability(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Trip,
            Route.route_name,
            Vehicle.vehicle_number,
            Vehicle.capacity,
            User.full_name,
            func.count(SeatAllocation.id).label("booked")
        )
        .join(Route, Trip.route_id == Route.id)
        .join(Vehicle, Trip.vehicle_id == Vehicle.id)
        .join(DriverProfile, Trip.driver_profile_id == DriverProfile.id)
        .join(User, DriverProfile.user_id == User.id)
        .outerjoin(SeatAllocation, SeatAllocation.trip_id == Trip.id)
        .where(Trip.trip_date >= date.today())
        .group_by(
            Trip.id,
            Route.route_name,
            Vehicle.vehicle_number,
            Vehicle.capacity,
            User.full_name
        )
        .order_by(Trip.trip_date, Trip.start_time)
    )

    rows = session.exec(stmt).all()

    return [
        TripAvailabilityRead(
            **trip.dict(),
            route_name=route,
            vehicle_number=vehicle,
            driver_name=driver,
            total_capacity=cap,
            booked_seats=booked,
            available_seats=cap - booked
        )
        for trip, route, vehicle, cap, driver, booked in rows
    ]



@router.post("/", response_model=TripRead)
def create_trip(
    data: TripCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Check TO role
    statement = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == current_user.id)
        .where(Role.name == "TO")
    )
    is_to = session.exec(statement).first()
    if not is_to:
        raise HTTPException(status_code=403, detail="Only TO can schedule trips")

    trip = Trip(
        vehicle_id=data.vehicle_id,
        driver_profile_id=data.driver_profile_id,
        route_id=data.route_id,
        direction=data.direction,
        trip_date=data.trip_date,
        start_time=data.start_time,
        status="SCHEDULED"
    )

    session.add(trip)
    session.commit()
    session.refresh(trip)

    return trip


@router.patch("/{trip_id}/start", response_model=TripRead)
def start_trip(
    trip_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get driver's profile
    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()

    if not driver_profile:
        raise HTTPException(status_code=403, detail="Only drivers can start trips")

    if trip.driver_profile_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not assigned to this trip")

    if trip.status not in VALID_TRIP_TRANSITIONS:
        raise HTTPException(status_code=400, detail="Invalid trip state")

    if "STARTED" not in VALID_TRIP_TRANSITIONS[trip.status]:
        raise HTTPException(status_code=400, detail="Trip cannot be started")

    trip.status = "STARTED"

    session.add(trip)
    session.commit()
    session.refresh(trip)

    return trip


@router.patch("/{trip_id}/complete", response_model=TripRead)
def complete_trip(
    trip_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()

    if not driver_profile:
        raise HTTPException(status_code=403, detail="Only drivers can complete trips")

    if trip.driver_profile_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not assigned to this trip")

    if "COMPLETED" not in VALID_TRIP_TRANSITIONS.get(trip.status, []):
        raise HTTPException(status_code=400, detail="Trip cannot be completed")

    trip.status = "COMPLETED"

    session.add(trip)
    session.commit()
    session.refresh(trip)

    return trip    