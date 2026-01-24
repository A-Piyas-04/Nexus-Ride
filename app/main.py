from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session

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

# Import seeds
from app.seeds.roles import seed_roles_and_to
from app.seeds.routes import seed_routes
from app.seeds.vehicles import seed_vehicles
from app.seeds.drivers import seed_drivers
from app.seeds.trips import seed_trips


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    
    # Run seeds
    with Session(engine) as session:
        seed_roles_and_to(session)
        seed_routes(session)
        seed_vehicles(session)
        seed_drivers(session)
        seed_trips(session)
            
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
