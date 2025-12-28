from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionRead, SubscriptionCreate
from app.core.security import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post(
    "",
    response_model=SubscriptionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_subscription(
    data: SubscriptionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Security Policy: Only STAFF can subscribe
    if current_user.user_type != "STAFF":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff members can subscribe.",
        )

    # Check if user already has an ACTIVE subscription
    existing_active = session.exec(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE",
        )
    ).first()

    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription",
        )

    today = date.today()

    subscription = Subscription(
        user_id=current_user.id,
        status="ACTIVE",
        start_date=today,
        end_date=None,  # Ongoing until cancelled or expired
    )
    session.add(subscription)
    session.commit()
    session.refresh(subscription)

    return subscription


@router.get(
    "/me",
    response_model=Optional[SubscriptionRead],
)
def get_my_active_subscription(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    subscription = session.exec(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE",
        )
    ).first()

    return subscription


@router.get(
    "/history",
    response_model=List[SubscriptionRead],
)
def get_my_subscription_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    subscriptions = session.exec(
        select(Subscription)
        .where(Subscription.user_id == current_user.id)
        .order_by(Subscription.start_date.desc())
    ).all()

    return subscriptions
