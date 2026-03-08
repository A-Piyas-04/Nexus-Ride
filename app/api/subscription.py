import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date
from calendar import monthrange

from app.db.session import get_session
from app.models.subscription import Subscription, SubscriptionLeave
from app.models.user import User
from app.models.route import RouteStop, Route
from app.schemas.subscription import (
    SubscriptionRead,
    SubscriptionCreate,
    SubscriptionLeaveCreateByUser,
    SubscriptionLeaveRead,
)
from app.models.subscription_override import SubscriptionPickupOverride
from app.schemas.subscription_override import SubscriptionPickupOverrideCreate, SubscriptionPickupOverrideRead
from uuid import uuid4
from app.core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.post("/change-pickup-today", response_model=SubscriptionPickupOverrideRead)
def change_pickup_today(
    data: SubscriptionPickupOverrideCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    today = date.today()
    
    # 1. Get user's ACTIVE subscription
    subscription = session.exec(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE"
        )
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription found"
        )
        
    # 2. Ensure today is within subscription period
    if subscription.start_date and today < subscription.start_date:
         raise HTTPException(status_code=400, detail="Subscription not started yet")
    if subscription.end_date and today > subscription.end_date:
         raise HTTPException(status_code=400, detail="Subscription expired")

    # 3. Ensure user is not on leave
    leave = session.exec(
        select(SubscriptionLeave).where(
            SubscriptionLeave.subscription_id == subscription.id,
            SubscriptionLeave.from_date <= today,
            SubscriptionLeave.to_date >= today
        )
    ).first()
    
    if leave:
        raise HTTPException(
            status_code=400,
            detail="Cannot change pickup while on leave"
        )

    # 4. Validate pickup_stop belongs to the same route
    # First get the route of the current subscription stop
    current_stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == subscription.stop_name)
    ).first()
    
    if not current_stop:
        # Should not happen if data integrity is maintained
        raise HTTPException(status_code=500, detail="Current subscription stop invalid")
        
    new_stop = session.get(RouteStop, data.pickup_stop_id)
    if not new_stop:
        raise HTTPException(status_code=404, detail="New stop not found")
        
    if new_stop.route_id != current_stop.route_id:
        raise HTTPException(
            status_code=400,
            detail="New pickup stop must be on the same route"
        )
        
    # 5. Save/Update override
    override = session.exec(
        select(SubscriptionPickupOverride).where(
            SubscriptionPickupOverride.subscription_id == subscription.id,
            SubscriptionPickupOverride.date == today
        )
    ).first()
    
    if override:
        override.pickup_stop_id = data.pickup_stop_id
        session.add(override)
    else:
        override = SubscriptionPickupOverride(
            id=uuid4(),
            subscription_id=subscription.id,
            date=today,
            pickup_stop_id=data.pickup_stop_id
        )
        session.add(override)
        
    session.commit()
    session.refresh(override)
    
    return SubscriptionPickupOverrideRead(
        pickup_stop_id=override.pickup_stop_id,
        stop_name=new_stop.stop_name,
        is_override=True,
        date=today
    )

@router.get("/pickup-today", response_model=SubscriptionPickupOverrideRead)
def get_pickup_today(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    today = date.today()
    
    subscription = session.exec(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "ACTIVE"
        )
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription")
        
    # Check for override
    override = session.exec(
        select(SubscriptionPickupOverride).where(
            SubscriptionPickupOverride.subscription_id == subscription.id,
            SubscriptionPickupOverride.date == today
        )
    ).first()
    
    if override:
        stop = session.get(RouteStop, override.pickup_stop_id)
        return SubscriptionPickupOverrideRead(
            pickup_stop_id=override.pickup_stop_id,
            stop_name=stop.stop_name,
            is_override=True,
            date=today
        )
    
    # Return default subscription stop
    stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == subscription.stop_name)
    ).first()
    
    return SubscriptionPickupOverrideRead(
        pickup_stop_id=stop.id,
        stop_name=stop.stop_name,
        is_override=False,
        date=today
    )


@router.post("/", response_model=SubscriptionRead)
def subscribe(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        if current_user.user_type != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only STAFF users can subscribe"
            )

        try:
            start_month = int(data.start_month)
            end_month = int(data.end_month)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid month format. Must be a number string (e.g. '01')"
            )
            
        year = data.year

        if start_month > end_month:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_month cannot be after end_month"
            )

        try:
            start_date = date(year, start_month, 1)
            last_day = monthrange(year, end_month)[1]
            end_date = date(year, end_month, last_day)
        except ValueError as e:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date calculation: {str(e)}"
            )

        stop = session.exec(
            select(RouteStop).where(RouteStop.stop_name == data.stop_name)
        ).first()
        if not stop:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid stop name: {data.stop_name}"
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
            session.add(subscription) # Ensure update is tracked

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
        route = session.get(Route, stop.route_id)
        route_name = route.route_name if route else None
        
        return SubscriptionRead(
            id=subscription.id,
            user_id=subscription.user_id,
            stop_name=subscription.stop_name,
            status=subscription.status,
            start_date=subscription.start_date,
            end_date=subscription.end_date,
            route_name=route_name,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in subscribe endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error processing subscription: {str(e)}"
        )




@router.get("/requests", response_model=list[SubscriptionRead])
def get_subscription_requests(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify if user has TO role
    # This is a basic check. In a more robust system, we would use a dependency like require_role("TO")
    # For now, we check if the user is a STAFF and has the email of the TO, or we check roles.
    # Since we implemented UserRole, let's check roles properly or stick to the simple check for now if we want to be fast.
    # The requirement says: "only 1 transport officer".
    # Let's check against the TO email or check if they have the TO role.
    
    # Check if user has TO role
    # We need to import UserRole and Role models to do a proper check
    from app.models.role import Role, UserRole
    
    statement = (
        select(Role)
        .join(UserRole)
        .where(UserRole.user_id == current_user.id)
        .where(Role.name == "TO")
    )
    is_to = session.exec(statement).first()
    
    if not is_to:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officer can view subscription requests"
        )

    # Use join to fetch Subscription and User together
    statement = (
        select(Subscription, User)
        .join(User, Subscription.user_id == User.id)
        .where(Subscription.status == "PENDING")
    )
    results = session.exec(statement).all()
    
    response = []
    for sub, user in results:
        stop = session.exec(
            select(RouteStop).where(RouteStop.stop_name == sub.stop_name)
        ).first()
        route = session.get(Route, stop.route_id) if stop else None
        route_name = route.route_name if route else None
        
        # Ensure we have a name to display
        display_name = user.full_name if user.full_name else "No Name"

        response.append(SubscriptionRead(
            id=sub.id,
            user_id=sub.user_id,
            user_name=display_name,
            stop_name=sub.stop_name,
            status=sub.status,
            start_date=sub.start_date,
            end_date=sub.end_date,
            route_name=route_name,
        ))
        
    return response

@router.put("/{subscription_id}/approve", response_model=SubscriptionRead)
def approve_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check if user has TO role
    from app.models.role import Role, UserRole
    
    statement = (
        select(Role)
        .join(UserRole)
        .where(UserRole.user_id == current_user.id)
        .where(Role.name == "TO")
    )
    is_to = session.exec(statement).first()
    
    if not is_to:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officer can approve subscriptions"
        )
        
    subscription = session.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    if subscription.status != "PENDING":
        raise HTTPException(status_code=400, detail="Subscription is not pending")
        
    subscription.status = "ACTIVE"
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    
    # Emit notification event
    try:
        from app.notifications.event_bus import event_bus
        event_bus.emit("SUBSCRIPTION_APPROVED", subscription, session)
    except Exception as e:
        logger.exception("Failed to emit notification: %s", e)
    
    stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == subscription.stop_name)
    ).first()
    route = session.get(Route, stop.route_id) if stop else None
    route_name = route.route_name if route else None
    
    user = session.get(User, subscription.user_id)
    user_name = user.full_name if user else "Unknown User"

    return SubscriptionRead(
        id=subscription.id,
        user_id=subscription.user_id,
        user_name=user_name,
        stop_name=subscription.stop_name,
        status=subscription.status,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        route_name=route_name,
    )

@router.put("/{subscription_id}/decline", response_model=SubscriptionRead)
def decline_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check if user has TO role
    from app.models.role import Role, UserRole
    
    statement = (
        select(Role)
        .join(UserRole)
        .where(UserRole.user_id == current_user.id)
        .where(Role.name == "TO")
    )
    is_to = session.exec(statement).first()
    
    if not is_to:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officer can decline subscriptions"
        )
        
    subscription = session.get(Subscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    if subscription.status != "PENDING":
        raise HTTPException(status_code=400, detail="Subscription is not pending")
        
    subscription.status = "INACTIVE" # Or REJECTED if available in enum, but defaulting to INACTIVE as per recent changes
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    
    stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == subscription.stop_name)
    ).first()
    route = session.get(Route, stop.route_id) if stop else None
    route_name = route.route_name if route else None
    
    user = session.get(User, subscription.user_id)
    user_name = user.full_name if user else "Unknown User"

    return SubscriptionRead(
        id=subscription.id,
        user_id=subscription.user_id,
        user_name=user_name,
        stop_name=subscription.stop_name,
        status=subscription.status,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        route_name=route_name,
    )

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

    stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == subscription.stop_name)
    ).first()
    route = session.get(Route, stop.route_id) if stop else None
    route_name = route.route_name if route else None
    return SubscriptionRead(
        id=subscription.id,
        user_id=subscription.user_id,
        stop_name=subscription.stop_name,
        status=subscription.status,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        route_name=route_name,
    )


# ----- Subscription Leave (1 day to 4 months) -----
MAX_LEAVE_DAYS = 120


@router.post("/leave", response_model=SubscriptionLeaveRead, status_code=status.HTTP_201_CREATED)
def create_leave(
    data: SubscriptionLeaveCreateByUser,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    subscription = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    if subscription.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active subscribers can take leave",
        )
    if data.from_date > data.to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date must be before or equal to to_date",
        )
    days = (data.to_date - data.from_date).days + 1
    if days > MAX_LEAVE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Leave period cannot exceed {MAX_LEAVE_DAYS} days (4 months)",
        )
    leave = SubscriptionLeave(
        subscription_id=subscription.id,
        from_date=data.from_date,
        to_date=data.to_date,
        reason=data.reason,
    )
    session.add(leave)
    session.commit()
    session.refresh(leave)
    return leave


@router.get("/leaves", response_model=list[SubscriptionLeaveRead])
def list_my_leaves(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    subscription = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()
    if not subscription:
        return []
    leaves = session.exec(
        select(SubscriptionLeave).where(
            SubscriptionLeave.subscription_id == subscription.id
        ).order_by(SubscriptionLeave.from_date.desc())
    ).all()
    return list(leaves)


@router.delete("/leave/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    leave = session.get(SubscriptionLeave, leave_id)
    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    subscription = session.get(Subscription, leave.subscription_id)
    if not subscription or subscription.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your leave")
    session.delete(leave)
    session.commit()
    return None
