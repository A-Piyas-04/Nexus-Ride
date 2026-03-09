from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import date, datetime, timezone
from uuid import UUID
import asyncio
import json

from app.db.session import get_session
from app.models.trip import Trip
from app.models.trip_stop_progress import TripStopProgress
from app.models.vehicle import Vehicle
from app.models.route import Route
from app.models.profile import DriverProfile
from app.models.seat_allocation import SeatAllocation
from app.models.subscription import Subscription
from app.models.token import Token
from app.schemas.trip import (
    TripAvailabilityRead,
    TripForDriverRead,
    TripPassengerRead,
    TripStopProgressRead,
    TripTrackingRead,
)
from app.models.role import Role, UserRole
from app.schemas.trip import TripCreate, TripRead
from app.core.security import get_current_user
from app.models.user import User
from app.models.route import RouteStop
from app.services.subscription_reserved import count_subscription_reserved, get_subscription_passengers_for_route_date
from app.realtime.tracking_broker import tracking_broker

router = APIRouter()

VALID_TRIP_TRANSITIONS = {
    "SCHEDULED": ["STARTED"],
    "STARTED": ["COMPLETED"],
    "COMPLETED": []
}

def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetimes are timezone-aware UTC (handles legacy naive values)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

def _publish_tracking_event_for_trip(
    *,
    session: Session,
    trip: Trip,
    event_type: str,
    stop_name: Optional[str],
    event_at: datetime,
) -> None:
    recipient_ids: set[UUID] = set()

    recipient_ids.update(
        session.exec(
            select(Token.user_id).where(
                Token.trip_id == trip.id,
                Token.status == "ACTIVE",
            )
        ).all()
    )
    recipient_ids.update(
        session.exec(select(SeatAllocation.user_id).where(SeatAllocation.trip_id == trip.id)).all()
    )
    for user_id, _full_name, _email, _pickup_stop_id, _pickup_stop_name in get_subscription_passengers_for_route_date(
        session, trip.route_id, trip.trip_date
    ):
        recipient_ids.add(user_id)

    payload = {
        "type": "tracking_event",
        "trip_id": str(trip.id),
        "route_id": str(trip.route_id),
        "trip_date": trip.trip_date.isoformat(),
        "event_type": event_type,
        "stop_name": stop_name,
        "event_at": _as_utc(event_at).isoformat(),
    }

    for user_id in recipient_ids:
        tracking_broker.publish(user_id, payload)


@router.get("/tracking/stream")
async def tracking_stream(
    current_user: User = Depends(get_current_user),
):
    queue = tracking_broker.subscribe(current_user.id)

    async def gen():
        try:
            yield (json.dumps({"type": "ready"}) + "\n").encode("utf-8")
            while True:
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=15)
                    yield (json.dumps(item) + "\n").encode("utf-8")
                except asyncio.TimeoutError:
                    yield (json.dumps({"type": "ping"}) + "\n").encode("utf-8")
        finally:
            tracking_broker.unsubscribe(current_user.id, queue)

    return StreamingResponse(gen(), media_type="application/x-ndjson")


@router.get("/tracking", response_model=list[TripTrackingRead])
def get_trip_tracking(
    trip_date: Optional[date] = Query(default=None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Returns live tracking information for:
    - Token buyers: trips they bought a token/seat for (on trip_date)
    - Subscribers: started trips for routes they are subscribed to (on trip_date)
    """
    target_date = trip_date or date.today()

    token_trip_ids = set(
        session.exec(
            select(Token.trip_id).where(
                Token.user_id == current_user.id,
                Token.travel_date == target_date,
                Token.status == "ACTIVE",
            )
        ).all()
    )

    # SeatAllocation is used widely across the app; include it as a fallback source of truth.
    seat_trip_ids = set(
        session.exec(
            select(SeatAllocation.trip_id)
            .join(Trip, Trip.id == SeatAllocation.trip_id)
            .where(
                SeatAllocation.user_id == current_user.id,
                Trip.trip_date == target_date,
            )
        ).all()
    )

    subscriber_route_ids = set(
        session.exec(
            select(RouteStop.route_id)
            .join(Subscription, Subscription.stop_name == RouteStop.stop_name)
            .where(
                Subscription.user_id == current_user.id,
                Subscription.status == "ACTIVE",
                func.coalesce(Subscription.start_date, target_date) <= target_date,
                func.coalesce(Subscription.end_date, target_date) >= target_date,
            )
        ).all()
    )

    candidate_trip_ids: set[UUID] = set()
    candidate_trip_ids.update(token_trip_ids)
    candidate_trip_ids.update(seat_trip_ids)

    trips: list[tuple[Trip, str]] = []
    if candidate_trip_ids:
        trips.extend(
            session.exec(
                select(Trip, Route.route_name)
                .join(Route, Trip.route_id == Route.id)
                .where(
                    Trip.id.in_(candidate_trip_ids),
                    Trip.trip_date == target_date,
                    Trip.status == "STARTED",
                    Trip.started_at.is_not(None),
                )
            ).all()
        )

    if subscriber_route_ids:
        trips.extend(
            session.exec(
                select(Trip, Route.route_name)
                .join(Route, Trip.route_id == Route.id)
                .where(
                    Trip.route_id.in_(subscriber_route_ids),
                    Trip.trip_date == target_date,
                    Trip.status == "STARTED",
                    Trip.started_at.is_not(None),
                )
            ).all()
        )

    # Deduplicate trips while keeping route_name
    trip_by_id: dict[UUID, tuple[Trip, str]] = {}
    for trip, route_name in trips:
        trip_by_id[trip.id] = (trip, route_name)

    if not trip_by_id:
        return []

    # Get progress for all relevant trips
    progress_rows = session.exec(
        select(TripStopProgress, RouteStop.stop_name, RouteStop.sequence_number)
        .join(RouteStop, RouteStop.id == TripStopProgress.route_stop_id)
        .where(TripStopProgress.trip_id.in_(list(trip_by_id.keys())))
    ).all()

    # Build progress map per trip
    # trip_id -> list of (progress, stop_name, sequence_number)
    progress_by_trip: dict[UUID, list] = {}
    for progress, stop_name, seq in progress_rows:
        if progress.trip_id not in progress_by_trip:
            progress_by_trip[progress.trip_id] = []
        progress_by_trip[progress.trip_id].append((progress, stop_name, seq))

    # Also need all route stops to determine "next" stop
    # This might be heavy if many routes. Optimizing: fetch only needed routes.
    route_ids = {trip.route_id for trip, _ in trip_by_id.values()}
    all_stops = session.exec(
        select(RouteStop)
        .where(RouteStop.route_id.in_(list(route_ids)))
        .order_by(RouteStop.route_id, RouteStop.sequence_number)
    ).all()

    # map route_id -> list of RouteStop sorted by sequence
    stops_by_route: dict[UUID, list[RouteStop]] = {}
    for rs in all_stops:
        if rs.route_id not in stops_by_route:
            stops_by_route[rs.route_id] = []
        stops_by_route[rs.route_id].append(rs)

    out: list[TripTrackingRead] = []
    for trip_id, (trip, route_name) in trip_by_id.items():
        started_at = _as_utc(trip.started_at)
        
        # Find latest event
        trip_progress = progress_by_trip.get(trip_id, [])
        
        last_event_type = "started"
        last_stop_name = None
        last_event_at = started_at
        last_stop_seq = -1

        # Sort progress by event time to find latest
        # Or simpler: iterate and find max time
        for progress, stop_name, seq in trip_progress:
            # Check departed
            if progress.departed_at:
                dt = _as_utc(progress.departed_at)
                if not last_event_at or (dt and dt > last_event_at):
                    last_event_at = dt
                    last_event_type = "departed"
                    last_stop_name = stop_name
                    last_stop_seq = seq
            # Check arrived (if not departed yet or arrived is later?? usually departed > arrived for same stop)
            # Actually we just want the absolute latest timestamp
            if progress.arrived_at:
                dt = _as_utc(progress.arrived_at)
                if not last_event_at or (dt and dt > last_event_at):
                    last_event_at = dt
                    last_event_type = "arrived"
                    last_stop_name = stop_name
                    last_stop_seq = seq
        
        # Determine next stop
        next_stop_name = None
        route_stops = stops_by_route.get(trip.route_id, [])
        
        if last_event_type == "started":
            # If just started, next is the first stop
            if route_stops:
                next_stop_name = route_stops[0].stop_name
        else:
            # If arrived/departed at a stop, find the next one in sequence
            # If arrived at X, next action is Depart from X (so next stop is still effectively X or next? 
            # Usually "Next Stop" implies the one we are moving TOWARDS.
            # If Arrived at X: we are at X. Next stop is X+1? Or we are waiting at X? 
            # If Departed from X: we are moving to X+1.
            
            # Let's say:
            # Arrived at X -> Next is X (to depart) or X+1?
            # User wants "Next: Mohakhali" when "Departed from Banani".
            # So if departed from current seq, next is seq + 1.
            # If arrived at current seq, we are AT current seq. Maybe next is still current (to depart) or next?
            # Standard transit logic: "Next Station" usually updates once you leave the previous one.
            # But if you are AT a station, "Next Station" is usually the *following* one.
            
            # Logic:
            # If status == departed from S(i), next is S(i+1).
            # If status == arrived at S(i), next is S(i+1) (because we are already at i).
            
            # Find current stop index
            # We have last_stop_seq. We want the stop with sequence > last_stop_seq
            # route_stops is sorted.
            
            for rs in route_stops:
                if rs.sequence_number > last_stop_seq:
                    next_stop_name = rs.stop_name
                    break

        out.append(
            TripTrackingRead(
                trip_id=trip.id,
                route_name=route_name,
                direction=trip.direction,
                trip_date=trip.trip_date,
                start_time=trip.start_time,
                started_at=started_at,
                last_event_type=last_event_type,
                last_stop_name=last_stop_name,
                last_event_at=last_event_at,
                next_stop_name=next_stop_name
            )
        )

    out.sort(key=lambda x: (x.trip_date, x.start_time))
    return out


@router.get("/my", response_model=list[TripForDriverRead])
def get_my_trips(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return trips assigned to the current driver (trip_date >= today)."""
    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()
    if not driver_profile:
        raise HTTPException(status_code=403, detail="Not a driver")
    stmt = (
        select(Trip, Route.route_name)
        .join(Route, Trip.route_id == Route.id)
        .where(
            Trip.driver_profile_id == driver_profile.id,
            Trip.trip_date >= date.today(),
        )
        .order_by(Trip.trip_date, Trip.start_time)
    )
    rows = session.exec(stmt).all()
    return [
        TripForDriverRead(**trip.dict(), route_name=route_name)
        for trip, route_name in rows
    ]


@router.get("/availability", response_model=list[TripAvailabilityRead])
def get_trips_availability(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Trip,
            Route.route_name,
            Vehicle.vehicle_number,
            Vehicle.capacity,
            User.full_name,
            func.count(SeatAllocation.id).label("booked")
        )
        .join(Route, Trip.route_id == Route.id)
        .join(Vehicle, Trip.vehicle_id == Vehicle.id)
        .join(DriverProfile, Trip.driver_profile_id == DriverProfile.id)
        .join(User, DriverProfile.user_id == User.id)
        .outerjoin(SeatAllocation, SeatAllocation.trip_id == Trip.id)
        .where(Trip.trip_date >= date.today())
        .group_by(
            Trip.id,
            Route.route_name,
            Vehicle.vehicle_number,
            Vehicle.capacity,
            User.full_name
        )
        .order_by(Trip.trip_date, Trip.start_time)
    )

    rows = session.exec(stmt).all()

    result = []
    for trip, route, vehicle, cap, driver, allocated in rows:
        sub_reserved = count_subscription_reserved(session, trip.route_id, trip.trip_date)
        booked_seats = allocated + sub_reserved
        result.append(
            TripAvailabilityRead(
                **trip.dict(),
                route_name=route,
                vehicle_number=vehicle,
                driver_name=driver,
                total_capacity=cap,
                booked_seats=booked_seats,
                available_seats=cap - booked_seats,
            )
        )
    return result



@router.post("/", response_model=TripRead)
def create_trip(
    data: TripCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Check TO role
    statement = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == current_user.id)
        .where(Role.name == "TO")
    )
    is_to = session.exec(statement).first()
    if not is_to:
        raise HTTPException(status_code=403, detail="Only TO can schedule trips")

    trip = Trip(
        vehicle_id=data.vehicle_id,
        driver_profile_id=data.driver_profile_id,
        route_id=data.route_id,
        direction=data.direction,
        trip_date=data.trip_date,
        start_time=data.start_time,
        status="SCHEDULED"
    )

    session.add(trip)
    session.commit()
    session.refresh(trip)

    return trip


@router.patch("/{trip_id}/start", response_model=TripRead)
def start_trip(
    trip_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Get driver's profile
    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()

    if not driver_profile:
        raise HTTPException(status_code=403, detail="Only drivers can start trips")

    if trip.driver_profile_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not assigned to this trip")

    if trip.status not in VALID_TRIP_TRANSITIONS:
        raise HTTPException(status_code=400, detail="Invalid trip state")

    if "STARTED" not in VALID_TRIP_TRANSITIONS[trip.status]:
        raise HTTPException(status_code=400, detail="Trip cannot be started")

    trip.status = "STARTED"
    if trip.started_at is None:
        trip.started_at = _utc_now()
    else:
        trip.started_at = _as_utc(trip.started_at)

    session.add(trip)
    session.commit()
    session.refresh(trip)

    _publish_tracking_event_for_trip(
        session=session,
        trip=trip,
        event_type="started",
        stop_name=None,
        event_at=trip.started_at,
    )

    return trip


@router.patch("/{trip_id}/complete", response_model=TripRead)
def complete_trip(
    trip_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()

    if not driver_profile:
        raise HTTPException(status_code=403, detail="Only drivers can complete trips")

    if trip.driver_profile_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not assigned to this trip")

    if "COMPLETED" not in VALID_TRIP_TRANSITIONS.get(trip.status, []):
        raise HTTPException(status_code=400, detail="Trip cannot be completed")

    trip.status = "COMPLETED"

    session.add(trip)
    session.commit()
    session.refresh(trip)

    return trip


@router.get("/{trip_id}/passengers", response_model=list[TripPassengerRead])
def get_trip_passengers(
    trip_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return passenger list for a trip. Only the assigned driver can access."""
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()
    if not driver_profile or trip.driver_profile_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not assigned to this trip")

    out: list[TripPassengerRead] = []

    # 1. Passengers from SeatAllocation (TOKEN, GUEST)
    stmt = (
        select(SeatAllocation, User.full_name, User.email, RouteStop.stop_name)
        .join(User, SeatAllocation.user_id == User.id)
        .join(RouteStop, SeatAllocation.pickup_stop_id == RouteStop.id)
        .where(SeatAllocation.trip_id == trip_id)
    )
    for alloc, full_name, email, stop_name in session.exec(stmt).all():
        out.append(
            TripPassengerRead(
                user_id=alloc.user_id,
                full_name=full_name or "—",
                email=email,
                seat_type=alloc.seat_type,
                pickup_stop_name=stop_name or "—",
            )
        )

    # 2. Subscribers (SUBSCRIPTION) for this route/date
    for user_id, full_name, email, _pickup_stop_id, pickup_stop_name in get_subscription_passengers_for_route_date(
        session, trip.route_id, trip.trip_date
    ):
        out.append(
            TripPassengerRead(
                user_id=user_id,
                full_name=full_name,
                email=email,
                seat_type="SUBSCRIPTION",
                pickup_stop_name=pickup_stop_name,
            )
        )

    return out


def _require_assigned_driver(
    *,
    session: Session,
    current_user: User,
    trip: Trip,
) -> DriverProfile:
    driver_profile = session.exec(
        select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    ).first()
    if not driver_profile:
        raise HTTPException(status_code=403, detail="Only drivers can perform this action")
    if trip.driver_profile_id != driver_profile.id:
        raise HTTPException(status_code=403, detail="Not assigned to this trip")
    return driver_profile


@router.get("/{trip_id}/progress", response_model=list[TripStopProgressRead])
def get_trip_progress(
    trip_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    _require_assigned_driver(session=session, current_user=current_user, trip=trip)

    stmt = (
        select(TripStopProgress, RouteStop.stop_name)
        .join(RouteStop, RouteStop.id == TripStopProgress.route_stop_id)
        .where(TripStopProgress.trip_id == trip_id)
        .order_by(TripStopProgress.arrived_at)
    )
    rows = session.exec(stmt).all()
    return [
        TripStopProgressRead(
            route_stop_id=progress.route_stop_id,
            stop_name=stop_name,
            arrived_at=_as_utc(progress.arrived_at),
            departed_at=_as_utc(progress.departed_at),
        )
        for progress, stop_name in rows
    ]


@router.patch("/{trip_id}/stops/{route_stop_id}/arrived", response_model=TripStopProgressRead)
def mark_stop_arrived(
    trip_id: UUID,
    route_stop_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    _require_assigned_driver(session=session, current_user=current_user, trip=trip)

    if trip.status != "STARTED":
        raise HTTPException(status_code=400, detail="Trip must be STARTED")

    stop = session.get(RouteStop, route_stop_id)
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    if stop.route_id != trip.route_id:
        raise HTTPException(status_code=400, detail="Stop does not belong to this trip route")

    progress = session.exec(
        select(TripStopProgress).where(
            TripStopProgress.trip_id == trip_id,
            TripStopProgress.route_stop_id == route_stop_id,
        )
    ).first()

    if progress and progress.departed_at is not None:
        raise HTTPException(status_code=400, detail="Stop already departed")

    now = _utc_now()
    if progress:
        progress.arrived_at = now
    else:
        progress = TripStopProgress(
            trip_id=trip_id,
            route_stop_id=route_stop_id,
            arrived_at=now,
        )

    session.add(progress)
    session.commit()
    session.refresh(progress)

    _publish_tracking_event_for_trip(
        session=session,
        trip=trip,
        event_type="arrived",
        stop_name=stop.stop_name,
        event_at=progress.arrived_at,
    )

    return TripStopProgressRead(
        route_stop_id=progress.route_stop_id,
        stop_name=stop.stop_name,
        arrived_at=_as_utc(progress.arrived_at),
        departed_at=_as_utc(progress.departed_at),
    )


@router.patch("/{trip_id}/stops/{route_stop_id}/departed", response_model=TripStopProgressRead)
def mark_stop_departed(
    trip_id: UUID,
    route_stop_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    _require_assigned_driver(session=session, current_user=current_user, trip=trip)

    if trip.status != "STARTED":
        raise HTTPException(status_code=400, detail="Trip must be STARTED")

    stop = session.get(RouteStop, route_stop_id)
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    if stop.route_id != trip.route_id:
        raise HTTPException(status_code=400, detail="Stop does not belong to this trip route")

    progress = session.exec(
        select(TripStopProgress).where(
            TripStopProgress.trip_id == trip_id,
            TripStopProgress.route_stop_id == route_stop_id,
        )
    ).first()
    if not progress:
        raise HTTPException(status_code=400, detail="Stop not marked arrived yet")
    if progress.departed_at is not None:
        raise HTTPException(status_code=400, detail="Stop already departed")

    progress.departed_at = _utc_now()
    session.add(progress)
    session.commit()
    session.refresh(progress)

    _publish_tracking_event_for_trip(
        session=session,
        trip=trip,
        event_type="departed",
        stop_name=stop.stop_name,
        event_at=progress.departed_at,
    )

    return TripStopProgressRead(
        route_stop_id=progress.route_stop_id,
        stop_name=stop.stop_name,
        arrived_at=_as_utc(progress.arrived_at),
        departed_at=_as_utc(progress.departed_at),
    )