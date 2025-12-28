from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date

from app.db.session import get_session
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionRead
from app.core.security import get_current_user

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.post("/", response_model=SubscriptionRead)
def subscribe(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if current_user.user_type != "STAFF":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only STAFF users can subscribe"
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

        subscription.status = "PENDING"
        subscription.start_date = date.today()
        subscription.end_date = None

    else:
        subscription = Subscription(
            user_id=current_user.id,
            status="PENDING",
            start_date=date.today()
        )
        session.add(subscription)

    session.commit()
    session.refresh(subscription)
    return subscription


@router.put("/", response_model=SubscriptionRead)
def update_subscription(
    status_update: str,
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
    
    if status_update not in ["PENDING", "ACTIVE", "EXPIRED"]:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )

    subscription.status = status_update
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return subscription

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
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

    session.delete(subscription)
    session.commit()


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
