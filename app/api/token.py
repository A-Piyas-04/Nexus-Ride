from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlmodel import func

from uuid import UUID
from datetime import date
from decimal import Decimal
from app.db.session import get_session
from app.models.token import Token
from app.models.seat_allocation import SeatAllocation
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.route import Route, RouteStop
from app.models.user import User
from app.models.profile import DriverProfile
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.schemas.token import TokenCreate, TokenRead
from app.schemas.token_history import TokenHistoryRead
from app.schemas.seat_allocation import SeatAllocationCreate, SeatAllocationRead
from app.schemas.payment import PaymentRead
from app.api.auth import get_current_user
from app.services.subscription_reserved import count_subscription_reserved
from app.services.trip_service import get_or_create_trip

router = APIRouter()

@router.post("/buy", response_model=PaymentRead)
def buy_token(
    data: TokenCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Find matching trip or create from template
    trip = get_or_create_trip(
        session=session,
        route_id=data.route_id,
        travel_date=data.travel_date,
        direction=data.direction
    )

    vehicle = session.get(Vehicle, trip.vehicle_id)

    allocated = session.exec(
        select(func.count(SeatAllocation.id))
        .where(SeatAllocation.trip_id == trip.id)
    ).one()
    sub_reserved = count_subscription_reserved(session, trip.route_id, trip.trip_date)
    booked = allocated + sub_reserved

    if booked >= vehicle.capacity:
        raise HTTPException(status_code=400, detail="No seats available")
        
    # Calculate amount (TODO: Implement real pricing logic)
    amount = Decimal("50.00")

    # Create Payment Record
    payment = Payment(
        user_id=current_user.id,
        amount=amount,
        payment_type=PaymentType.TOKEN,
        payment_method=data.payment_method,
        reference_type=PaymentType.TOKEN,
        reference_id=None, # Will be updated after token creation
        status=PaymentStatus.INITIATED,
        payment_metadata={
            "route_id": str(data.route_id),
            "pickup_stop_id": str(data.pickup_stop_id),
            "travel_date": data.travel_date.isoformat(),
            "direction": data.direction,
            "consumer_email": data.consumer_email,
            "trip_id": str(trip.id) # Storing trip_id to avoid re-querying
        }
    )

    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    # Construct response
    payment_response = PaymentRead.from_orm(payment)
    payment_response.payment_url = f"https://mock-gateway.com/pay/{payment.id}"

    return payment_response


@router.get("/my-tokens", response_model=list[TokenRead])
def get_my_tokens(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    tokens = session.exec(select(Token).where(Token.user_id == current_user.id)).all()
    return tokens


@router.get("/history", response_model=list[TokenHistoryRead])
def get_token_history(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a history of purchased tokens with detailed trip info.
    Joins: Token -> Trip -> Route, Vehicle, DriverProfile -> User, RouteStop
    """
    stmt = (
        select(
            Token,
            Route.route_name,
            RouteStop.stop_name,
            Vehicle.vehicle_number,
            User.full_name.label("driver_name"),
            Trip.direction.label("trip_direction")
        )
        .join(Trip, Token.trip_id == Trip.id)
        .join(Route, Trip.route_id == Route.id)
        .join(RouteStop, Token.pickup_stop_id == RouteStop.id)
        .join(Vehicle, Trip.vehicle_id == Vehicle.id)
        .join(DriverProfile, Trip.driver_profile_id == DriverProfile.id)
        .join(User, DriverProfile.user_id == User.id)
        .where(Token.user_id == current_user.id)
        .order_by(Token.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    results = session.exec(stmt).all()

    history = []
    for token, route_name, stop_name, vehicle_number, driver_name, trip_direction in results:
        history.append(
            TokenHistoryRead(
                token_id=token.id,
                travel_date=token.travel_date,
                route_name=route_name,
                pickup_stop=stop_name,
                direction=trip_direction,
                vehicle_number=vehicle_number,
                driver_name=driver_name,
                status=token.status,
                created_at=token.created_at
            )
        )
    
    return history
