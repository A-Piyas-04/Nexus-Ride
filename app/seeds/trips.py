from datetime import date, time
from sqlmodel import Session, select
from app.models.trip import Trip
from app.models.route import Route
from app.models.vehicle import Vehicle
from app.models.profile import DriverProfile

def seed_trips(session: Session):
    trip_seed = [
        {
            "route_name": "Route-1",
            "start_time": time(7, 30),
            "status": "STARTED",
            "vehicle_number": "NR-208",
        },
        {
            "route_name": "Route-1",
            "start_time": time(8, 5),
            "status": "SCHEDULED",
            "vehicle_number": "NR-219",
        },
        {
            "route_name": "Route-2",
            "start_time": time(8, 15),
            "status": "STARTED",
            "vehicle_number": "NR-331",
        },
        {
            "route_name": "Route-2",
            "start_time": time(4, 45),
            "status": "SCHEDULED",
            "vehicle_number": "NR-514",
        },
    ]

    today = date.today()
    
    route_map = {
        route.route_name: route
        for route in session.exec(select(Route)).all()
    }
    
    vehicle_map = {
        v.vehicle_number: v
        for v in session.exec(select(Vehicle)).all()
    }
    
    profiles = session.exec(select(DriverProfile)).all()
    profile_by_vehicle_id = {p.assigned_vehicle_id: p for p in profiles if p.assigned_vehicle_id}

    for trip in trip_seed:
        route = route_map.get(trip["route_name"])
        vehicle = vehicle_map.get(trip["vehicle_number"])
        
        if not route or not vehicle:
            continue
            
        driver_profile = profile_by_vehicle_id.get(vehicle.id)
        
        if not driver_profile:
            continue
            
        existing_trip = session.exec(
            select(Trip).where(
                Trip.route_id == route.id,
                Trip.vehicle_id == vehicle.id,
                Trip.trip_date == today,
                Trip.start_time == trip["start_time"],
            )
        ).first()
        if not existing_trip:
            session.add(
                Trip(
                    vehicle_id=vehicle.id,
                    driver_profile_id=driver_profile.id,
                    route_id=route.id,
                    trip_date=today,
                    start_time=trip["start_time"],
                    status=trip["status"],
                )
            )

    session.commit()
