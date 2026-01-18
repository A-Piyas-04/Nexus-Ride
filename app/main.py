from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    
# Create tables on startup

    with Session(engine) as session:
        for name in ["NORMAL_STAFF", "FACULTY", "TO"]:
            existing = session.exec(select(Role).where(Role.name == name)).first()
            if not existing:
                session.add(Role(name=name))

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
