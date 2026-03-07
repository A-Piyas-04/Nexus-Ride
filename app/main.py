from dotenv import load_dotenv

load_dotenv()

from datetime import date
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session

from app.db.session import engine
from app.services.trip_generator import generate_trips_for_date
from app.services.scheduler import start_scheduler, stop_scheduler
from app.api.auth import router as auth_router
from app.api.subscription import router as subscription_router
from app.api.trips import router as trips_router
from app.api.drivers import router as drivers_router
from app.api.staff import router as staff_router
from app.api.transport_requests import router as transport_requests_router
from app.api.routes import router as routes_router
from app.api.vehicle import router as vehicles_router
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.profile import DriverProfile, StaffProfile
from app.models.role import Role, UserRole
from app.models.route import Route, RouteStop
from app.models.seat_allocation import SeatAllocation
from app.models.subscription import Subscription, SubscriptionLeave
from app.models.token import Token
from app.models.trip import Trip
from app.models.trip_template import TripTemplate
from app.models.schedule_override import ScheduleOverride
from app.models.user import User
from app.models.vehicle import Vehicle
from app.api.routes import router as routes_router
from app.api.stops import router as stops_router
from app.api.token import router as token_router
from app.api.trip_templates import router as trip_templates_router
from app.notifications.api import router as notifications_router
from app.notifications.registry import discover_handlers
from app.notifications.models import Notification as NotificationV2

# Import seeds
from app.seeds.roles import seed_roles_and_to
from app.seeds.routes import seed_routes
from app.seeds.vehicles import seed_vehicles
from app.seeds.drivers import seed_drivers
from app.seeds.trips import seed_trip_templates


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)

    # Run seeds
    with Session(engine) as session:
        seed_roles_and_to(session)
        seed_routes(session)
        seed_vehicles(session)
        seed_drivers(session)
        seed_trip_templates(session)
        generate_trips_for_date(session, date.today())

    start_scheduler()
    discover_handlers()

    yield

    stop_scheduler()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(subscription_router)
app.include_router(trips_router, prefix="/trips", tags=["trips"])
app.include_router(drivers_router)
app.include_router(staff_router)
app.include_router(transport_requests_router)
app.include_router(routes_router)
app.include_router(vehicles_router)
app.include_router(stops_router, prefix="/stops", tags=["stops"])
app.include_router(token_router, prefix="/token", tags=["token"])
app.include_router(trip_templates_router)

from app.api.payment import router as payment_router
app.include_router(payment_router)
app.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
