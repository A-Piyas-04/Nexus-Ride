"""
Transport Officer analytics: ridership over time, ridership by route, revenue over time.
All endpoints require TO role.
"""
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func

from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.trip import Trip
from app.models.route import Route
from app.models.seat_allocation import SeatAllocation
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.schemas.analytics import (
    RidershipOverTimePoint,
    RidershipByRoutePoint,
    RevenueOverTimePoint,
)
from app.services.subscription_reserved import count_subscription_reserved

router = APIRouter()


def _has_role(user: User, role_name: str, session: Session) -> bool:
    statement = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user.id)
        .where(Role.name == role_name)
    )
    return session.exec(statement).first() is not None


def _require_transport_officer(user: User, session: Session):
    from fastapi import HTTPException, status
    if user.user_type != "STAFF" or not _has_role(user, "TO", session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officers can access this resource.",
        )


@router.get(
    "/ridership-over-time",
    response_model=list[RidershipOverTimePoint],
)
def get_ridership_over_time(
    days: int = Query(default=14, ge=1, le=90),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_transport_officer(current_user, session)
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    # All trips in range with route_id
    trips_stmt = (
        select(Trip)
        .where(Trip.trip_date >= start_date, Trip.trip_date <= end_date)
    )
    trips = list(session.exec(trips_stmt).all())

    # SeatAllocation count per trip_id
    trip_ids = [t.id for t in trips]
    alloc_counts = defaultdict(int)
    if trip_ids:
        alloc_stmt = (
            select(SeatAllocation.trip_id, func.count(SeatAllocation.id))
            .where(SeatAllocation.trip_id.in_(trip_ids))
            .group_by(SeatAllocation.trip_id)
        )
        for trip_id, cnt in session.exec(alloc_stmt).all():
            alloc_counts[trip_id] = cnt

    # Per-day: unique (route_id, trip_date) for subscription reserved (count once per route per day)
    day_trips = defaultdict(list)  # date -> [Trip]
    route_date_done = set()  # (route_id, trip_date) already counted for sub
    day_sub_seats = defaultdict(int)  # date -> extra seats from subscription

    for t in trips:
        day_trips[t.trip_date].append(t)
        key = (t.route_id, t.trip_date)
        if key not in route_date_done:
            route_date_done.add(key)
            day_sub_seats[t.trip_date] += count_subscription_reserved(
                session, t.route_id, t.trip_date
            )

    # Build response for every day in range
    result = []
    d = start_date
    while d <= end_date:
        day_trip_list = day_trips.get(d, [])
        trips_count = len(day_trip_list)
        seats_used = day_sub_seats.get(d, 0)
        for t in day_trip_list:
            seats_used += alloc_counts.get(t.id, 0)
        result.append(
            RidershipOverTimePoint(
                date=d,
                trips_count=trips_count,
                seats_used=seats_used,
            )
        )
        d += timedelta(days=1)

    return result


@router.get(
    "/ridership-by-route",
    response_model=list[RidershipByRoutePoint],
)
def get_ridership_by_route(
    days: int = Query(default=30, ge=1, le=90),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_transport_officer(current_user, session)
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    trips_stmt = (
        select(Trip, Route.route_name)
        .join(Route, Trip.route_id == Route.id)
        .where(Trip.trip_date >= start_date, Trip.trip_date <= end_date)
    )
    rows = list(session.exec(trips_stmt).all())

    # route_id -> (route_name, trips_count, passengers_total)
    route_info = {}  # route_id -> route_name
    route_trips = defaultdict(list)  # route_id -> [Trip]

    for trip, route_name in rows:
        route_info[trip.route_id] = route_name
        route_trips[trip.route_id].append(trip)

    trip_ids = [t.id for t, _ in rows]
    alloc_counts = defaultdict(int)
    if trip_ids:
        alloc_stmt = (
            select(SeatAllocation.trip_id, func.count(SeatAllocation.id))
            .where(SeatAllocation.trip_id.in_(trip_ids))
            .group_by(SeatAllocation.trip_id)
        )
        for trip_id, cnt in session.exec(alloc_stmt).all():
            alloc_counts[trip_id] = cnt

    # Per route: passengers = sum(alloc per trip) + sum(sub_reserved per unique (route_id, trip_date))
    route_date_done = set()
    route_sub = defaultdict(int)

    for trip, _ in rows:
        key = (trip.route_id, trip.trip_date)
        if key not in route_date_done:
            route_date_done.add(key)
            route_sub[trip.route_id] += count_subscription_reserved(
                session, trip.route_id, trip.trip_date
            )

    result = []
    for route_id, trip_list in route_trips.items():
        passengers = route_sub.get(route_id, 0)
        for t in trip_list:
            passengers += alloc_counts.get(t.id, 0)
        result.append(
            RidershipByRoutePoint(
                route_id=route_id,
                route_name=route_info[route_id],
                trips_count=len(trip_list),
                passengers_total=passengers,
            )
        )

    result.sort(key=lambda x: x.passengers_total, reverse=True)
    return result


@router.get(
    "/revenue-over-time",
    response_model=list[RevenueOverTimePoint],
)
def get_revenue_over_time(
    days: int = Query(default=14, ge=1, le=90),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_transport_officer(current_user, session)
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    start_dt = datetime.combine(start_date, time.min)
    end_dt = datetime.combine(end_date, time(23, 59, 59, 999999))

    payments_stmt = (
        select(Payment)
        .where(
            Payment.status == PaymentStatus.SUCCESS,
            Payment.created_at >= start_dt,
            Payment.created_at <= end_dt,
        )
    )
    payments = list(session.exec(payments_stmt).all())

    # Group by date in Python
    by_date = defaultdict(lambda: {"total": Decimal("0"), "token": 0, "subscription": 0})
    for p in payments:
        d = p.created_at.date() if hasattr(p.created_at, "date") else p.created_at
        by_date[d]["total"] += p.amount
        if p.payment_type == PaymentType.TOKEN:
            by_date[d]["token"] += 1
        else:
            by_date[d]["subscription"] += 1

    result = []
    d = start_date
    while d <= end_date:
        data = by_date.get(d, {"total": Decimal("0"), "token": 0, "subscription": 0})
        result.append(
            RevenueOverTimePoint(
                date=d,
                total_amount=data["total"],
                token_count=data["token"],
                subscription_count=data["subscription"],
            )
        )
        d += timedelta(days=1)

    return result
