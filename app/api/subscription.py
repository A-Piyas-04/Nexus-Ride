from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date
from calendar import monthrange

from app.db.session import get_session
from app.models.subscription import Subscription
from app.models.user import User
from app.models.route import RouteStop
from app.schemas.subscription import SubscriptionRead, SubscriptionCreate
from app.core.security import get_current_user

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.post("/", response_model=SubscriptionRead)
def subscribe(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.user_type != "STAFF":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only STAFF users can subscribe"
        )

    start_month = int(data.start_month)
    end_month = int(data.end_month)
    year = data.year

    if start_month > end_month:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_month cannot be after end_month"
        )

    start_date = date(year, start_month, 1)
    last_day = monthrange(year, end_month)[1]
    end_date = date(year, end_month, last_day)

    stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == data.stop_name)
    ).first()
    if not stop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid stop name"
        )

    subscription = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()

    if subscription:
        if subscription.status in {"ACTIVE", "PENDING"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription already active or pending"
            )

        subscription.stop_name = data.stop_name
        subscription.status = "PENDING"
        subscription.start_date = start_date
        subscription.end_date = end_date

    else:
        subscription = Subscription(
            user_id=current_user.id,
            stop_name=data.stop_name,
            status="PENDING",
            start_date=start_date,
            end_date=end_date
        )
        session.add(subscription)

    session.commit()
    session.refresh(subscription)
    return subscription



@router.get("/", response_model=SubscriptionRead)
def get_subscription(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    subscription = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )

    return subscription
