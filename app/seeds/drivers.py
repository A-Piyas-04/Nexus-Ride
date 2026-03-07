from sqlmodel import Session, select
from app.models.user import User
from app.models.profile import DriverProfile
from app.models.vehicle import Vehicle
from app.utils.hashing import hash_password

# Single source of truth for seed driver mobile numbers (used by seed and by auth to auto-approve on login)
SEED_DRIVER_MOBILES = ["01700000001", "01700000002", "01700000003", "01700000004"]


def seed_drivers(session: Session):
    driver_seed = [
        {
            "full_name": "Shafiul Islam",
            "mobile_number": "01700000001",
            "license_number": "DL-1021",
            "vehicle_number": "NR-208",
        },
        {
            "full_name": "Imran Hossain",
            "mobile_number": "01700000002",
            "license_number": "DL-1045",
            "vehicle_number": "NR-331",
        },
        {
            "full_name": "Sakib Ahmed",
            "mobile_number": "01700000003",
            "license_number": "DL-1206",
            "vehicle_number": "NR-219",
        },
        {
            "full_name": "Nazia Rahman",
            "mobile_number": "01700000004",
            "license_number": "DL-1110",
            "vehicle_number": "NR-514",
        },
    ]

    for driver in driver_seed:
        user = session.exec(select(User).where(User.mobile_number == driver["mobile_number"])).first()
        if not user:
            user = User(
                mobile_number=driver["mobile_number"],
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

        vehicle = session.exec(
            select(Vehicle).where(Vehicle.vehicle_number == driver["vehicle_number"])
        ).first()
        assigned_vehicle_id = vehicle.id if vehicle else None

        if not driver_profile:
            driver_profile = DriverProfile(
                user_id=user.id,
                email=user.email,
                mobile_number=user.mobile_number,
                license_number=driver["license_number"],
                assigned_vehicle_id=assigned_vehicle_id,
                driver_status=1,
            )
            session.add(driver_profile)
            session.commit()
        else:
            updated = False
            if assigned_vehicle_id and driver_profile.assigned_vehicle_id is None:
                driver_profile.assigned_vehicle_id = assigned_vehicle_id
                updated = True
            if driver_profile.mobile_number is None:
                driver_profile.mobile_number = user.mobile_number
                updated = True
            if driver_profile.email is None:
                driver_profile.email = user.email
                updated = True
            if driver_profile.driver_status != 1:
                driver_profile.driver_status = 1
                updated = True
            if updated:
                session.add(driver_profile)
                session.commit()
            elif driver_profile.driver_status != 1:
                driver_profile.driver_status = 1
                session.add(driver_profile)
                session.commit()

    # Guarantee: any driver whose mobile is in seed list is approved (fixes existing DBs)
    for profile in session.exec(select(DriverProfile).join(User, DriverProfile.user_id == User.id).where(User.mobile_number.in_(SEED_DRIVER_MOBILES))).all():
        if profile.driver_status != 1:
            profile.driver_status = 1
            session.add(profile)
    session.commit()
