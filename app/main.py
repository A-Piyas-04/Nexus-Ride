from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel
from app.db.session import engine
from app.api.auth import router as auth_router
from app.api.subscription import router as subscription_router

# Import models to ensure they are registered with SQLModel
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.subscription import Subscription
from app.models.staff_profile import StaffProfile
from app.models.driver_profile import DriverProfile
from app.models.vehicle import Vehicle
from app.models.route import Route
from app.models.route_stop import RouteStop
from app.models.trip import Trip
from app.models.seat_allocation import SeatAllocation
from app.models.payment import Payment
from app.models.notification import Notification

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(subscription_router)
