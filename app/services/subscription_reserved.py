"""
Count how many seats are reserved by ACTIVE subscriptions for a given route/date,
excluding subscribers who are on leave for that date.
Also provides list of subscriber passengers for a trip (for driver passenger list).
"""
from datetime import date
from uuid import UUID
from typing import List, Optional, Tuple

from sqlmodel import Session, select, func, or_

from app.models.subscription import Subscription, SubscriptionLeave
from app.models.route import RouteStop
from app.models.subscription_override import SubscriptionPickupOverride
from app.models.user import User


def count_subscription_reserved(
    session: Session,
    route_id: UUID,
    trip_date: date,
) -> int:
    """
    Returns the number of ACTIVE subscriptions that reserve a seat on this route
    for trip_date, excluding those with a SubscriptionLeave covering trip_date.
    """
    on_leave = (
        select(SubscriptionLeave.subscription_id).where(
            SubscriptionLeave.from_date <= trip_date,
            SubscriptionLeave.to_date >= trip_date,
        )
    )

    count_stmt = (
        select(func.count(Subscription.id))
        .select_from(Subscription)
        .join(RouteStop, RouteStop.stop_name == Subscription.stop_name)
        .where(
            RouteStop.route_id == route_id,
            Subscription.status == "ACTIVE",
            or_(Subscription.start_date.is_(None), Subscription.start_date <= trip_date),
            or_(Subscription.end_date.is_(None), Subscription.end_date >= trip_date),
            Subscription.id.notin_(on_leave),
        )
    )
    total = session.exec(count_stmt).one()
    return total or 0


def get_subscription_passengers_for_route_date(
    session: Session,
    route_id: UUID,
    trip_date: date,
) -> List[Tuple[UUID, str, Optional[str], UUID, str]]:
    """
    Returns list of (user_id, full_name, email, pickup_stop_id, pickup_stop_name)
    for ACTIVE subscribers on this route for trip_date, excluding those on leave.
    Uses SubscriptionPickupOverride for trip_date when present.
    """
    on_leave = (
        select(SubscriptionLeave.subscription_id).where(
            SubscriptionLeave.from_date <= trip_date,
            SubscriptionLeave.to_date >= trip_date,
        )
    )
    sub_stmt = (
        select(Subscription.id, Subscription.user_id, Subscription.stop_name)
        .select_from(Subscription)
        .join(RouteStop, RouteStop.stop_name == Subscription.stop_name)
        .where(
            RouteStop.route_id == route_id,
            Subscription.status == "ACTIVE",
            or_(Subscription.start_date.is_(None), Subscription.start_date <= trip_date),
            or_(Subscription.end_date.is_(None), Subscription.end_date >= trip_date),
            Subscription.id.notin_(on_leave),
        )
    )
    subs = session.exec(sub_stmt).all()
    result = []
    for sub_id, user_id, stop_name in subs:
        override = session.exec(
            select(SubscriptionPickupOverride).where(
                SubscriptionPickupOverride.subscription_id == sub_id,
                SubscriptionPickupOverride.date == trip_date,
            )
        ).first()
        if override:
            stop = session.get(RouteStop, override.pickup_stop_id)
            pickup_stop_id = override.pickup_stop_id
            pickup_stop_name = stop.stop_name if stop else stop_name
        else:
            stop = session.exec(
                select(RouteStop).where(
                    RouteStop.route_id == route_id,
                    RouteStop.stop_name == stop_name,
                )
            ).first()
            pickup_stop_id = stop.id if stop else None
            pickup_stop_name = stop_name
        if not pickup_stop_id:
            continue
        user = session.get(User, user_id)
        full_name = user.full_name if user else "Unknown"
        email = user.email if user else None
        result.append((user_id, full_name, email, pickup_stop_id, pickup_stop_name))
    return result
