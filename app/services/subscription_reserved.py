"""
Count how many seats are reserved by ACTIVE subscriptions for a given route/date,
excluding subscribers who are on leave for that date.
"""
from datetime import date
from uuid import UUID

from sqlmodel import Session, select, func, or_

from app.models.subscription import Subscription, SubscriptionLeave
from app.models.route import RouteStop


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
