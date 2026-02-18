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
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

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

