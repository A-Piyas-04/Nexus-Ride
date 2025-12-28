from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date, timedelta
from app.db.session import get_session
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionRead, SubscriptionCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/subscription", tags=["subscription"])

@router.post("/", response_model=SubscriptionRead)
def subscribe(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Check if user already has an active subscription
    statement = select(Subscription).where(
        Subscription.user_id == current_user.id,
        Subscription.status == "ACTIVE"
    )
    existing_sub = session.exec(statement).first()
    
    if existing_sub:
        # Check if it's expired (though status should reflect this, double check date)
        if existing_sub.end_date and existing_sub.end_date >= date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription"
            )
        else:
            # Update status to EXPIRED if date passed but status says ACTIVE
            existing_sub.status = "EXPIRED"
            session.add(existing_sub)
            session.commit()

    # Create new subscription
    start_date = date.today()
    end_date = start_date + timedelta(days=30) # Default 30 days
    
    new_sub = Subscription(
        user_id=current_user.id,
        status="ACTIVE",
        start_date=start_date,
        end_date=end_date
    )
    
    session.add(new_sub)
    session.commit()
    session.refresh(new_sub)
    return new_sub

@router.get("/", response_model=SubscriptionRead)
def get_subscription_status(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Get latest subscription
    statement = select(Subscription).where(
        Subscription.user_id == current_user.id
    ).order_by(Subscription.id.desc())
    
    subscription = session.exec(statement).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription found")
        
    return subscription
