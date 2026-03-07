from datetime import date
from uuid import UUID
from fastapi import HTTPException
from sqlmodel import Session, select
from app.models.trip import Trip
from app.models.trip_template import TripTemplate

def get_or_create_trip(
    session: Session,
    route_id: UUID,
    travel_date: date,
    direction: str
) -> Trip:
    """
    Finds an existing trip or creates one from a template if it doesn't exist.
    """
    
    # 1. Normalize direction if needed (handle frontend "UP"/"DOWN" vs backend "TO_IUT"/"FROM_IUT")
    normalized_direction = direction
    if direction == "UP":
        normalized_direction = "TO_IUT"
    elif direction == "DOWN":
        normalized_direction = "FROM_IUT"
        
    # 2. Try to find existing trip
    statement = select(Trip).where(
        Trip.route_id == route_id,
        Trip.trip_date == travel_date,
        Trip.direction == normalized_direction,
        Trip.status == "SCHEDULED"
    )
    trip = session.exec(statement).first()
    
    if trip:
        return trip

    # 3. If not found, look for a matching template
    template_stmt = select(TripTemplate).where(
        TripTemplate.route_id == route_id,
        TripTemplate.direction == normalized_direction,
        TripTemplate.is_active == True
    )
    
    # Check valid_from / valid_to if present
    templates = session.exec(template_stmt).all()
    
    valid_template = None
    for tmpl in templates:
        if tmpl.valid_from and travel_date < tmpl.valid_from:
            continue
        if tmpl.valid_to and travel_date > tmpl.valid_to:
            continue
        valid_template = tmpl
        break # Just take the first valid one
        
    if not valid_template:
        raise HTTPException(
            status_code=404, 
            detail="No trip scheduled or template found for this route/date"
        )
        
    # 4. Create new trip from template
    new_trip = Trip(
        vehicle_id=valid_template.vehicle_id,
        driver_profile_id=valid_template.driver_profile_id,
        route_id=valid_template.route_id,
        direction=valid_template.direction,
        trip_date=travel_date,
        start_time=valid_template.start_time,
        status="SCHEDULED"
    )
    
    session.add(new_trip)
    session.commit()
    session.refresh(new_trip)
    
    return new_trip
