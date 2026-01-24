from sqlmodel import Session, select
from app.models.vehicle import Vehicle

def seed_vehicles(session: Session):
    vehicle_seed = [
        {"vehicle_number": "NR-208", "capacity": 32, "status": "AVAILABLE"},
        {"vehicle_number": "NR-331", "capacity": 28, "status": "AVAILABLE"},
        {"vehicle_number": "NR-219", "capacity": 30, "status": "IN_SERVICE"},
        {"vehicle_number": "NR-514", "capacity": 36, "status": "AVAILABLE"},
    ]

    for data in vehicle_seed:
        vehicle = session.exec(
            select(Vehicle).where(Vehicle.vehicle_number == data["vehicle_number"])
        ).first()
        if not vehicle:
            vehicle = Vehicle(**data)
            session.add(vehicle)
            session.commit()
