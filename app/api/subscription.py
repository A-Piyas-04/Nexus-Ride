from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date
from calendar import monthrange

from app.db.session import get_session
from app.models.subscription import Subscription
from app.models.user import User
from app.models.route import RouteStop, Route
from app.schemas.subscription import SubscriptionRead, SubscriptionCreate
from app.core.security import get_current_user

router = APIRouter(prefix="/subscription", tags=["subscription"])


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
