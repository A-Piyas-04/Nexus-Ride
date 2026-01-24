from sqlmodel import Session, select
from app.models.user import User
from app.models.profile import DriverProfile
from app.models.vehicle import Vehicle
from app.utils.hashing import hash_password

def seed_drivers(session: Session):
    driver_seed = [
        {
            "full_name": "Shafiul Islam",
            "email": "shafiul.islam@iut-dhaka.edu",
            "license_number": "DL-1021",
            "vehicle_number": "NR-208",
        },
        {
            "full_name": "Imran Hossain",
            "email": "imran.hossain@iut-dhaka.edu",
            "license_number": "DL-1045",
            "vehicle_number": "NR-331",
        },
        {
            "full_name": "Sabbir Ahmed",
            "email": "sabbir.ahmed@iut-dhaka.edu",
            "license_number": "DL-1206",
            "vehicle_number": "NR-219",
        },
        {
            "full_name": "Nazia Rahman",
            "email": "nazia.rahman@iut-dhaka.edu",
            "license_number": "DL-1110",
            "vehicle_number": "NR-514",
        },
    ]

    for driver in driver_seed:
        user = session.exec(select(User).where(User.email == driver["email"])).first()
        if not user:
            user = User(
                email=driver["email"],
                password_hash=hash_password("driver123"),
                full_name=driver["full_name"],
                user_type="DRIVER",
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        driver_profile = session.exec(
            select(DriverProfile).where(DriverProfile.user_id == user.id)
        ).first()
        
        # Find vehicle
        vehicle = session.exec(
            select(Vehicle).where(Vehicle.vehicle_number == driver["vehicle_number"])
        ).first()
        
        if vehicle:
            assigned_vehicle_id = vehicle.id
            
            if not driver_profile:
                driver_profile = DriverProfile(
                    user_id=user.id,
                    license_number=driver["license_number"],
                    assigned_vehicle_id=assigned_vehicle_id,
                )
                session.add(driver_profile)
                session.commit()
            elif driver_profile.assigned_vehicle_id is None:
                driver_profile.assigned_vehicle_id = assigned_vehicle_id
                session.add(driver_profile)
                session.commit()
