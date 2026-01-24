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

@router.get("/availability", response_model=List[TripAvailabilityRead])
def get_trips_availability(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    date_from: Optional[date] = Query(None, description="Filter trips from this date"),
    date_to: Optional[date] = Query(None, description="Filter trips up to this date"),
    route_id: Optional[UUID] = Query(None, description="Filter by specific route"),
):
    """
    Get real-time seat availability for trips.
    Accessible by authenticated users (Staff).
    """
    
    # Base query: Trip + Vehicle + Route
    query = (
        select(Trip, Vehicle, Route, DriverProfile, User)
        .join(Vehicle, Trip.vehicle_id == Vehicle.id)
        .join(Route, Trip.route_id == Route.id)
        .join(DriverProfile, Trip.driver_profile_id == DriverProfile.id)
        .join(User, DriverProfile.user_id == User.id)
    )

    # Apply filters
    if date_from:
        query = query.where(Trip.trip_date >= date_from)
    else:
        # Default to showing future trips including today if no date specified
        query = query.where(Trip.trip_date >= date.today())
        
    if date_to:
        query = query.where(Trip.trip_date <= date_to)
        
    if route_id:
        query = query.where(Trip.route_id == route_id)

    # Order by date and time
    query = query.order_by(Trip.trip_date, Trip.start_time)
    
    results = session.exec(query).all()
    
    response_data = []
    
    for trip, vehicle, route, driver_profile, driver_user in results:
        # Count booked seats for this trip
        # Note: In a high-traffic production app, we would optimize this N+1 query 
        # with a group_by on the main query or a separate batch count query.
        booked_count = session.exec(
            select(func.count(SeatAllocation.id))
            .where(SeatAllocation.trip_id == trip.id)
        ).one()
        
        available_seats = vehicle.capacity - booked_count
        
        trip_data = TripAvailabilityRead(
            **trip.dict(),
            route_name=route.route_name,
            vehicle_number=vehicle.vehicle_number,
            driver_name=driver_user.full_name,
            total_capacity=vehicle.capacity,
            booked_seats=booked_count,
            available_seats=available_seats
        )
        response_data.append(trip_data)
        
    return response_data
