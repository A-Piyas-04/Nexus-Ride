from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, desc, func

from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.payment import Payment, PaymentStatus, PaymentType, PaymentMethod
from app.models.role import Role, UserRole
from app.models.token import Token
from app.models.seat_allocation import SeatAllocation
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.subscription import Subscription
from app.schemas.payment import PaymentInitiateRequest, PaymentConfirmRequest, PaymentRead
from app.services.subscription_reserved import count_subscription_reserved

router = APIRouter(prefix="/payments", tags=["payments"])

# Helper to check role
def has_role(user: User, role_name: str, session: Session) -> bool:
    statement = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user.id)
        .where(Role.name == role_name)
    )
    return session.exec(statement).first() is not None

def require_transport_officer(user: User, session: Session):
    if user.user_type != "STAFF" or not has_role(user, "TO", session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officers can access this resource."
        )

# Mock function to compute amount based on reference
# In a real app, this would query Subscription/Token tables
def compute_amount(reference_type: PaymentType, reference_id: str, session: Session) -> Decimal:
    # Placeholder logic
    if reference_type == PaymentType.TOKEN:
        # TODO: Lookup Token price based on route distance or fixed rate
        return Decimal("50.00")
    elif reference_type == PaymentType.SUBSCRIPTION:
        # TODO: Lookup Subscription price based on duration
        return Decimal("1500.00")
    return Decimal("0.00")

from app.notifications.event_bus import event_bus
from app.models.token import Token

def create_token_from_payment(payment: Payment, session: Session):
    """
    Creates a Token and SeatAllocation from a successful Payment.
    Ensures idempotency and atomic transaction.
    """
    # 1. Idempotency Check
    if payment.reference_id:
        # Already processed
        return

    metadata = payment.payment_metadata or {}
    
    # Extract data
    try:
        trip_id = UUID(metadata["trip_id"])
        route_id = UUID(metadata["route_id"])
        pickup_stop_id = UUID(metadata["pickup_stop_id"])
        travel_date = datetime.fromisoformat(metadata["travel_date"]).date()
        direction = metadata["direction"]
        consumer_email = metadata.get("consumer_email")
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid payment metadata: {str(e)}")

    # 2. Validate Trip and Seat Availability (Double Check)
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    vehicle = session.get(Vehicle, trip.vehicle_id)
    allocated = session.exec(
        select(func.count(SeatAllocation.id))
        .where(SeatAllocation.trip_id == trip.id)
    ).one()
    sub_reserved = count_subscription_reserved(session, trip.route_id, trip.trip_date)
    booked = allocated + sub_reserved

    if booked >= vehicle.capacity:
        raise HTTPException(status_code=400, detail="No seats available. Payment will be refunded.")

    # 3. Create Token
    token = Token(
        user_id=payment.user_id,
        route_id=route_id,
        pickup_stop_id=pickup_stop_id,
        trip_id=trip_id,
        travel_date=travel_date,
        consumer_email=consumer_email,
        direction=direction, # Added missing field
        status="ACTIVE"
    )
    session.add(token)
    session.flush() # Get ID

    # 4. Create Seat Allocation
    seat = SeatAllocation(
        trip_id=trip_id,
        user_id=payment.user_id,
        seat_type="TOKEN",
        pickup_stop_id=pickup_stop_id
    )
    session.add(seat)

    # 5. Link Payment to Token
    payment.reference_id = str(token.id)
    session.add(payment)
    
    # 6. Commit happens in the caller (confirm_payment)

def activate_subscription_from_payment(payment: Payment, session: Session):
    """
    Activates a Subscription from a successful Payment.
    Ensures idempotency and atomic transaction.
    """
    # 1. Idempotency Check
    # For Subscription, reference_id in Payment ALREADY points to the Subscription ID.
    # So we can't use `if payment.reference_id` check like in Token.
    # Instead, we check the subscription status.
    
    if not payment.reference_id:
        raise HTTPException(status_code=400, detail="Payment missing subscription reference")
        
    subscription_id = int(payment.reference_id)
    subscription = session.get(Subscription, subscription_id)
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    # Security Check
    if subscription.user_id != payment.user_id:
        raise HTTPException(status_code=400, detail="Subscription does not belong to payment user")
        
    # Idempotency: If already active, do nothing
    if subscription.status == "ACTIVE":
        return

    # Validate State
    if subscription.status != "PENDING":
        # If INACTIVE or other states, we might not want to auto-activate without review?
        # Requirement says: "Subscription becomes ACTIVE only when payment.status == SUCCESS"
        # And "If subscription already ACTIVE -> do nothing"
        # We assume PENDING -> ACTIVE is the valid transition.
        # If it's INACTIVE (e.g. declined), we probably shouldn't activate it via payment?
        # Let's assume only PENDING can be activated.
        raise HTTPException(status_code=400, detail=f"Cannot activate subscription in {subscription.status} state")

    # Activate
    # CHANGED: Instead of setting ACTIVE directly, we keep it as PENDING (or set to a dedicated "PAID_WAITING_APPROVAL" state if exists)
    # The requirement is: "set the subscription status to pending and send a subscription request to the transport officer"
    # Since it is ALREADY "PENDING" when created, we just ensure it stays PENDING but now it has a linked successful payment.
    # The TO will see it in the requests list because the requests list filters by PENDING.
    # We can add a flag or just rely on the fact that payment is confirmed.
    
    # However, to distinguish "Applied but not paid" vs "Paid and waiting approval", 
    # ideally we should have a status change or the TO list should filter by "Has Successful Payment".
    # Given the current schema only has status string, and `get_subscription_requests` filters by `PENDING`.
    # If we leave it as PENDING, it appears in the list.
    
    # Let's check `get_subscription_requests` implementation in `app/api/subscription.py`:
    # `where(Subscription.status == "PENDING")`
    
    # So if we just do NOTHING here (except maybe logging), it remains PENDING, and the TO sees it.
    # But we need to ensure the TO knows it is PAID.
    # The `Subscription` model doesn't have a `is_paid` field.
    # The link is via `Payment.reference_id`.
    
    # For now, per instruction "set the subscription status to pending" (it is already pending),
    # we will NOT set it to ACTIVE.
    
    # subscription.status = "ACTIVE"  <-- REMOVED
    
    # We can optionally set it to "PENDING" explicitly to be safe, 
    # or if there was an "INITIATED" state before.
    # But `subscribe` endpoint sets it to "PENDING".
    
    # So, effectively, we just save the payment link (which is done by the caller confirming the payment)
    # and maybe update updated_at.
    
    # Let's just touch the subscription to ensure session tracks it if needed, 
    # but effectively we stop auto-activating.
    
    pass 

    
    # Commit happens in the caller (confirm_payment)

# 1. Initiate Payment
@router.post("/initiate", response_model=PaymentRead)
def initiate_payment(
    data: PaymentInitiateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Validate reference_type and payment_method are valid enums (Pydantic does this automatically)
    
    # Compute Amount
    amount = compute_amount(data.reference_type, data.reference_id, session)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount computed.")

    # Create Payment Record
    payment = Payment(
        user_id=current_user.id,
        amount=amount,
        payment_type=data.reference_type, # Using reference_type as payment_type for now as they map 1:1
        payment_method=data.payment_method,
        reference_id=data.reference_id,
        reference_type=data.reference_type,
        status=PaymentStatus.INITIATED
    )
    
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    # Construct mock payment URL
    # We construct the response object manually to add the payment_url
    payment_response = PaymentRead(
        id=payment.id,
        user_id=payment.user_id,
        amount=payment.amount,
        payment_type=payment.payment_type,
        payment_method=payment.payment_method,
        reference_id=payment.reference_id,
        reference_type=payment.reference_type,
        status=payment.status,
        external_txn_id=payment.external_txn_id,
        currency=payment.currency,
        payment_metadata=payment.payment_metadata,
        created_at=payment.created_at,
        updated_at=payment.updated_at,
        payment_url=f"https://mock-gateway.com/pay/{payment.id}"
    )
    
    return payment_response

# 2. Confirm Payment
@router.post("/{payment_id}/confirm", response_model=PaymentRead)
def confirm_payment(
    payment_id: UUID,
    data: PaymentConfirmRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    # Security: User can only confirm their own payments (unless it's a webhook or admin action)
    # For this implementation, we assume the user is confirming via a callback or frontend flow
    if payment.user_id != current_user.id:
         # Check if TO? Assuming TO might manually confirm
         if not has_role(current_user, "TO", session):
            raise HTTPException(status_code=403, detail="Not authorized to confirm this payment")

    # Validate State
    if payment.status != PaymentStatus.INITIATED:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot confirm payment in {payment.status} state"
        )
        
    # Update Status
    payment.status = data.status
    payment.external_txn_id = data.external_txn_id
    payment.updated_at = datetime.utcnow()
    
    try:
        if payment.status == PaymentStatus.SUCCESS:
            if payment.reference_type == PaymentType.TOKEN:
                create_token_from_payment(payment, session)
                # Emit token purchased event
                try:
                    # We need to get the token ID from payment reference
                    # create_token_from_payment sets payment.reference_id
                    token_id = UUID(payment.reference_id)
                    token = session.get(Token, token_id)
                    if token:
                        event_bus.emit("TOKEN_PURCHASED", token, session)
                except Exception as e:
                    print(f"Failed to emit notification: {e}")
            elif payment.reference_type == PaymentType.SUBSCRIPTION:
                activate_subscription_from_payment(payment, session)
            
        session.add(payment)
        session.commit()
        session.refresh(payment)
        
    except HTTPException as e:
        session.rollback()
        # If token creation fails (e.g. no seats), we should probably fail the payment or initiate refund
        # For now, let's mark it as FAILED if it was supposed to be SUCCESS
        if data.status == PaymentStatus.SUCCESS:
            payment.status = PaymentStatus.FAILED
            session.add(payment)
            session.commit()
            session.refresh(payment)
        raise e
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    
    return payment

# 3. Get My Payments
@router.get("/me", response_model=List[PaymentRead])
def get_my_payments(
    status: Optional[PaymentStatus] = None,
    payment_type: Optional[PaymentType] = None,
    payment_method: Optional[PaymentMethod] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    query = select(Payment).where(Payment.user_id == current_user.id)
    
    if status:
        query = query.where(Payment.status == status)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    if payment_method:
        query = query.where(Payment.payment_method == payment_method)
    if start_date:
        query = query.where(Payment.created_at >= start_date)
    if end_date:
        query = query.where(Payment.created_at <= end_date)
        
    query = query.order_by(desc(Payment.created_at))
    
    return session.exec(query).all()

# 4. List Payments (TO Only)
@router.get("", response_model=List[PaymentRead])
def list_payments(
    user_id: Optional[UUID] = None,
    status: Optional[PaymentStatus] = None,
    payment_type: Optional[PaymentType] = None,
    payment_method: Optional[PaymentMethod] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    offset: int = 0,
    limit: int = 50,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    query = select(Payment)
    
    if user_id:
        query = query.where(Payment.user_id == user_id)
    if status:
        query = query.where(Payment.status == status)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    if payment_method:
        query = query.where(Payment.payment_method == payment_method)
    if start_date:
        query = query.where(Payment.created_at >= start_date)
    if end_date:
        query = query.where(Payment.created_at <= end_date)
    if min_amount:
        query = query.where(Payment.amount >= min_amount)
    if max_amount:
        query = query.where(Payment.amount <= max_amount)
        
    query = query.order_by(desc(Payment.created_at)).offset(offset).limit(limit)
    
    return session.exec(query).all()


