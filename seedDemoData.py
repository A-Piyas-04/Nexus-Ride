import random
import uuid
from datetime import datetime, timedelta, date, time
from decimal import Decimal

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, select
from sqlalchemy import inspect

load_dotenv()

from app.db.session import engine

from app.models.user import User
from app.models.profile import StaffProfile, DriverProfile
from app.models.route import Route, RouteStop
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.subscription import Subscription
from app.models.token import Token
from app.models.payment import Payment, PaymentMethod, PaymentStatus, PaymentType
from app.models.seat_allocation import SeatAllocation
from app.models.notification import Notification
from app.models.trip_stop_progress import TripStopProgress
from app.seeds.routes import seed_routes
from app.seeds.vehicles import seed_vehicles

# -----------------------------
# CONFIG
# -----------------------------

NUM_STAFF = 25
NUM_DRIVERS = 4
SEED_START_DATE = date(2026, 1, 1)

TOKEN_PRICE = 50
SUB_PRICE = 2500
DEMO_PREFIX = "DEMO"


# -----------------------------
# UTILITIES
# -----------------------------

def rand_phone():
    return "01" + "".join([str(random.randint(0, 9)) for _ in range(9)])


def rand_name(prefix):
    return f"{prefix}_{random.randint(1000,9999)}"

def generate_unique_mobile(session: Session) -> str:
    while True:
        mobile = rand_phone()
        existing = session.exec(select(User).where(User.mobile_number == mobile)).first()
        if not existing:
            return mobile

def ensure_prerequisites(session: Session):
    routes = session.exec(select(Route)).all()
    stops = session.exec(select(RouteStop)).all()
    vehicles = session.exec(select(Vehicle)).all()

    if not routes or not stops:
        seed_routes(session)

    if not vehicles:
        seed_vehicles(session)

def ensure_schema(engine):
    SQLModel.metadata.create_all(engine)

    inspector = inspect(engine)
    if "trip" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("trip")}
        if "started_at" not in columns:
            if engine.url.get_backend_name() == "sqlite":
                SQLModel.metadata.drop_all(engine)
                SQLModel.metadata.create_all(engine)
            else:
                raise RuntimeError("Database schema is out of date (missing trip.started_at). Run migrations or recreate the DB.")

def pick_stop_for_route(session: Session, route_id):
    stops = session.exec(select(RouteStop).where(RouteStop.route_id == route_id)).all()
    if not stops:
        raise RuntimeError(f"No stops found for route_id={route_id}")
    return random.choice(stops)

def iter_dates(start_date: date, end_date: date):
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)

def random_datetime_on_date(target_date: date, max_dt: datetime | None = None) -> datetime:
    seconds = random.randint(0, 24 * 60 * 60 - 1)
    dt = datetime.combine(target_date, time(0, 0, 0)) + timedelta(seconds=seconds)
    if max_dt is not None and dt > max_dt:
        return max_dt
    return dt


# -----------------------------
# CREATE STAFF USERS
# -----------------------------

def create_staff(session: Session, run_tag: str):

    users = []

    for i in range(NUM_STAFF):

        email = f"{DEMO_PREFIX.lower()}-staff{i}-{run_tag}@iut-dhaka.edu"

        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash="demo_hash",
            full_name=f"Staff {i}",
            user_type="STAFF",
            mobile_number=generate_unique_mobile(session),
        )

        session.add(user)
        users.append(user)

    session.commit()

    # create staff profiles
    routes = session.exec(select(Route)).all()
    if not routes:
        raise RuntimeError("No routes found. seed_routes() should have created routes before create_staff().")

    for user in users:

        route = random.choice(routes)
        stop = pick_stop_for_route(session, route.id)

        profile = StaffProfile(
            user_id=user.id,
            staff_code=f"{DEMO_PREFIX}-STAFF-{run_tag}-{uuid.uuid4().hex[:6].upper()}",
            department=random.choice(["CSE","EEE","ME","CE"]),
            default_route_id=route.id,
            default_pickup_stop_id=stop.id,
            email=user.email,
            mobile_number=user.mobile_number
        )

        session.add(profile)

    session.commit()

    print("Staff created:", len(users))
    return users


# -----------------------------
# CREATE DRIVERS
# -----------------------------

def create_drivers(session: Session, run_tag: str):

    drivers = []

    vehicles = session.exec(select(Vehicle)).all()
    if not vehicles:
        raise RuntimeError("No vehicles found. seed_vehicles() should have created vehicles before create_drivers().")

    for i in range(NUM_DRIVERS):

        user = User(
            id=uuid.uuid4(),
            email=f"{DEMO_PREFIX.lower()}-driver{i}-{run_tag}@iut-dhaka.edu",
            password_hash="demo_hash",
            full_name=f"Driver {i}",
            user_type="DRIVER",
            mobile_number=generate_unique_mobile(session),
        )

        session.add(user)
        session.commit()

        profile = DriverProfile(
            user_id=user.id,
            email=user.email,
            mobile_number=user.mobile_number,
            license_number=f"{DEMO_PREFIX}-DL-{run_tag}-{uuid.uuid4().hex[:6].upper()}",
            assigned_vehicle_id=random.choice(vehicles).id,
            driver_status=1,
        )

        session.add(profile)
        drivers.append(profile)

    session.commit()

    print("Drivers created:", len(drivers))
    return drivers


# -----------------------------
# CREATE TRIPS
# -----------------------------

def create_trips(session: Session, drivers, start_date: date, end_date: date):

    routes = session.exec(select(Route)).all()
    vehicles = session.exec(select(Vehicle)).all()
    if not routes:
        raise RuntimeError("No routes found. seed_routes() should have created routes before create_trips().")
    if not vehicles:
        raise RuntimeError("No vehicles found. seed_vehicles() should have created vehicles before create_trips().")
    if not drivers:
        raise RuntimeError("No drivers created.")

    trips = []

    for trip_date in iter_dates(start_date, end_date):

        for route in routes:

            for direction in ["TO_IUT", "FROM_IUT"]:
                start_time = time(hour=7 if direction=="TO_IUT" else 17)
                existing_trip = session.exec(
                    select(Trip).where(
                        Trip.route_id == route.id,
                        Trip.trip_date == trip_date,
                        Trip.start_time == start_time,
                        Trip.direction == direction,
                    )
                ).first()
                if existing_trip:
                    trips.append(existing_trip)
                    continue

                trip = Trip(
                    id=uuid.uuid4(),
                    vehicle_id=random.choice(vehicles).id,
                    driver_profile_id=random.choice(drivers).id,
                    route_id=route.id,
                    direction=direction,
                    trip_date=trip_date,
                    start_time=start_time,
                    status=random.choice(["COMPLETED","COMPLETED","STARTED"])
                )

                session.add(trip)
                trips.append(trip)

    session.commit()

    print("Trips created:", len(trips))
    return trips


# -----------------------------
# CREATE TOKENS + PAYMENTS
# -----------------------------

def create_tokens(session: Session, users, trips, start_date: date):

    tokens = []

    if not users:
        raise RuntimeError("No users provided to create_tokens().")

    now_utc = datetime.utcnow()

    for trip in trips:
        if trip.trip_date < start_date:
            continue

        weekday = trip.trip_date.weekday()

        if weekday in (5, 6):  # Saturday, Sunday
            target = 0
        elif weekday == 0:  # Monday
            target = 20 if trip.direction=="TO_IUT" else 5

        elif weekday == 4:  # Friday
            target = 20 if trip.direction=="FROM_IUT" else 5

        else:
            target = random.randint(6,10)

        for _ in range(target):

            user = random.choice(users)
            stop = pick_stop_for_route(session, trip.route_id)

            day_end = datetime.combine(trip.trip_date, time(23, 59, 59))
            payment_created_at = random_datetime_on_date(trip.trip_date, max_dt=min(day_end, now_utc))

            token = Token(
                user_id=user.id,
                route_id=trip.route_id,
                pickup_stop_id=stop.id,
                trip_id=trip.id,
                travel_date=trip.trip_date,
                status="USED",
                created_at=payment_created_at,
            )

            session.add(token)
            session.flush()

            payment = Payment(
                id=uuid.uuid4(),
                user_id=user.id,
                amount=Decimal(str(TOKEN_PRICE)),
                payment_type=PaymentType.TOKEN,
                payment_method=random.choice([PaymentMethod.BKASH, PaymentMethod.NAGAD, PaymentMethod.UPAY]),
                reference_type=PaymentType.TOKEN,
                reference_id=str(token.id),
                status=PaymentStatus.SUCCESS,
                created_at=payment_created_at,
                updated_at=payment_created_at,
            )

            session.add(payment)

            tokens.append(token)

    session.commit()

    print("Tokens created:", len(tokens))
    return tokens


# -----------------------------
# SEAT ALLOCATION
# -----------------------------

def create_seats(session, tokens):

    seats = []

    for token in tokens:

        seat = SeatAllocation(
            id=uuid.uuid4(),
            trip_id=token.trip_id,
            user_id=token.user_id,
            seat_type="TOKEN",
            pickup_stop_id=token.pickup_stop_id
        )

        session.add(seat)
        seats.append(seat)

    session.commit()

    print("Seat allocations:", len(seats))


# -----------------------------
# NOTIFICATIONS
# -----------------------------

def create_notifications(session, users):

    for user in users:

        for _ in range(random.randint(3,7)):

            notif = Notification(
                id=uuid.uuid4(),
                user_id=user.id,
                title="Demo Notification",
                message="This is a demo notification for presentation.",
                event_type=random.choice([
                    "TOKEN_PURCHASED",
                    "SUBSCRIPTION_APPROVED",
                    "TRIP_STARTED"
                ]),
                reference_type="SYSTEM",
                is_read=random.choice([True, False])
            )

            session.add(notif)

    session.commit()

    print("Notifications generated")


# -----------------------------
# MAIN
# -----------------------------

def main():

    ensure_schema(engine)

    with Session(engine) as session:
        seed_demo_data(session)


def seed_demo_data(session: Session, run_tag: str | None = None):

    ensure_prerequisites(session)

    run_tag = run_tag or datetime.now().strftime("%Y%m%d%H%M%S")
    end_date = date.today()

    print(f"Database URL: {engine.url}")
    print("Seeding demo data...")

    staff = create_staff(session, run_tag)
    drivers = create_drivers(session, run_tag)

    trips = create_trips(session, drivers, start_date=SEED_START_DATE, end_date=end_date)

    tokens = create_tokens(session, staff, trips, start_date=SEED_START_DATE)

    create_seats(session, tokens)

    create_notifications(session, staff)

    user_count = len(session.exec(select(User)).all())
    trip_count = len(session.exec(select(Trip)).all())
    token_count = len(session.exec(select(Token)).all())
    notification_count = len(session.exec(select(Notification)).all())
    first_payment_at = session.exec(
        select(Payment.created_at).order_by(Payment.created_at).limit(1)
    ).first()
    last_payment_at = session.exec(
        select(Payment.created_at).order_by(Payment.created_at.desc()).limit(1)
    ).first()
    print(f"Counts -> users={user_count}, trips={trip_count}, tokens={token_count}, notifications={notification_count}")
    print(f"Payment dates -> first={first_payment_at}, last={last_payment_at}")
    print("Demo data generation complete.")


if __name__ == "__main__":
    main()
