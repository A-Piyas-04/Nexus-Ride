from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlmodel import func

from uuid import UUID
from datetime import date
from app.db.session import get_session
from app.models.token import Token
from app.models.seat_allocation import SeatAllocation
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.route import Route
from app.models.user import User
from app.schemas.token import TokenCreate, TokenRead
from app.schemas.seat_allocation import SeatAllocationCreate, SeatAllocationRead
from app.api.auth import get_current_user



router = APIRouter()

@router.post("/buy", response_model=TokenRead)
def buy_token(
    data: TokenCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Find matching trip
    trip = session.exec(
        select(Trip).where(
            Trip.route_id == data.route_id,
            Trip.trip_date == data.travel_date,
            Trip.direction == data.direction, 
            Trip.status == "SCHEDULED"
        )
    ).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    vehicle = session.get(Vehicle, trip.vehicle_id)

    booked = session.exec(
        select(func.count(SeatAllocation.id))
        .where(SeatAllocation.trip_id == trip.id)
    ).one()

    if booked >= vehicle.capacity:
        raise HTTPException(status_code=400, detail="No seats available")

    # Create token
    token = Token(
        user_id=current_user.id,
        route_id=data.route_id,
        pickup_stop_id=data.pickup_stop_id,
        trip_id=trip.id, 
        travel_date=data.travel_date,
        consumer_email=data.consumer_email,
        direction=data.direction,
        status="ACTIVE"
    )

    session.add(token)
    session.flush()  # get token.id without commit

    seat = SeatAllocation(
        trip_id=trip.id,
        user_id=current_user.id,
        seat_type="TOKEN",
        pickup_stop_id=data.pickup_stop_id
    )

    session.add(seat)

    session.commit()

    session.refresh(token)

    return token


@router.get("/my-tokens", response_model=list[TokenRead])
def get_my_tokens(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    tokens = session.exec(select(Token).where(Token.user_id == current_user.id)).all()
    return tokens
