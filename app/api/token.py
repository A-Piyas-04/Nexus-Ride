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
from app.models.route import Route
from app.models.user import User
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.schemas.token import TokenCreate, TokenRead
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
