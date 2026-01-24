from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from datetime import date, time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, select

from app.db.session import engine
from app.api.auth import router as auth_router
from app.api.subscription import router as subscription_router
from app.api.trips import router as trips_router
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.profile import DriverProfile, StaffProfile
from app.models.role import Role, UserRole
from app.models.route import Route, RouteStop
from app.models.seat_allocation import SeatAllocation
from app.models.subscription import Subscription, SubscriptionLeave
from app.models.token import Token
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle
from app.utils.hashing import hash_password
from app.core.to_credentials import TO_EMAIL, TO_PASSWORD


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    
# Create tables on startup

    with Session(engine) as session:
        for name in ["NORMAL_STAFF", "FACULTY", "TO"]:
            existing = session.exec(select(Role).where(Role.name == name)).first()
            if not existing:
                session.add(Role(name=name))
        
        # Ensure TO user exists
        to_user = session.exec(select(User).where(User.email == TO_EMAIL)).first()
        if not to_user:
            to_user = User(
                email=TO_EMAIL,
                password_hash=hash_password(TO_PASSWORD),
                full_name="Transport Officer",
                user_type="STAFF"
            )
            session.add(to_user)
            session.flush()
            
            # Assign roles: NORMAL_STAFF and TO
            normal_staff_role = session.exec(select(Role).where(Role.name == "NORMAL_STAFF")).first()
            to_role = session.exec(select(Role).where(Role.name == "TO")).first()
            
            if normal_staff_role:
                session.add(UserRole(user_id=to_user.id, role_id=normal_staff_role.id))
            if to_role:
                session.add(UserRole(user_id=to_user.id, role_id=to_role.id))
            
            session.commit()

        route_definitions = {
            "Route-1": [
                "Tongi Station Road",
                "Uttara Sector 7",
                "Airport",
                "Banani",
                "Mohakhali",
                "Farmgate",
            ],
            "Route-2": [
                "Abdullahpur",
                "Mirpur 10",
                "Agargaon",
                "Bijoy Sarani",
                "Shahbagh",
                "Motijheel",
            ],
        }

        for route_name, stops in route_definitions.items():
            route = session.exec(
                select(Route).where(Route.route_name == route_name)
            ).first()
            if not route:
                route = Route(route_name=route_name, is_active=True)
                session.add(route)
                session.commit()
                session.refresh(route)

            for index, stop_name in enumerate(stops, start=1):
                existing_stop = session.exec(
                    select(RouteStop).where(RouteStop.stop_name == stop_name)
                ).first()
                if not existing_stop:
                    session.add(
                        RouteStop(
                            route_id=route.id,
                            stop_name=stop_name,
                            sequence_number=index,
                        )
                    )

        session.commit()

        vehicle_seed = [
            {"vehicle_number": "NR-208", "capacity": 32, "status": "AVAILABLE"},
            {"vehicle_number": "NR-331", "capacity": 28, "status": "AVAILABLE"},
            {"vehicle_number": "NR-219", "capacity": 30, "status": "IN_SERVICE"},
            {"vehicle_number": "NR-514", "capacity": 36, "status": "AVAILABLE"},
        ]

        vehicle_map = {}
        for data in vehicle_seed:
            vehicle = session.exec(
                select(Vehicle).where(Vehicle.vehicle_number == data["vehicle_number"])
            ).first()
            if not vehicle:
                vehicle = Vehicle(**data)
                session.add(vehicle)
                session.commit()
                session.refresh(vehicle)
            vehicle_map[data["vehicle_number"]] = vehicle

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

        driver_profile_map = {}
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
            assigned_vehicle_id = vehicle_map[driver["vehicle_number"]].id
            if not driver_profile:
                driver_profile = DriverProfile(
                    user_id=user.id,
                    license_number=driver["license_number"],
                    assigned_vehicle_id=assigned_vehicle_id,
                )
                session.add(driver_profile)
                session.commit()
                session.refresh(driver_profile)
            elif driver_profile.assigned_vehicle_id is None:
                driver_profile.assigned_vehicle_id = assigned_vehicle_id
                session.add(driver_profile)
                session.commit()
                session.refresh(driver_profile)

            driver_profile_map[driver["vehicle_number"]] = driver_profile

        route_map = {
            route.route_name: route
            for route in session.exec(select(Route)).all()
        }

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
        for trip in trip_seed:
            route = route_map.get(trip["route_name"])
            vehicle = vehicle_map.get(trip["vehicle_number"])
            driver_profile = driver_profile_map.get(trip["vehicle_number"])
            if not route or not vehicle or not driver_profile:
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

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(subscription_router)
app.include_router(trips_router, prefix="/trips", tags=["trips"])
