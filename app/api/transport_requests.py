from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.transport_request import TransportRequest, Guest, TransportRequestStatusLog, RequestStatus
from app.schemas.transport_request import (
    TransportRequestCreate, 
    TransportRequestRead, 
    TransportRequestUpdateStatus, 
    TransportRequestAssign
)

router = APIRouter(prefix="/transport-requests", tags=["transport-requests"])

# Helper to check role
def has_role(user: User, role_name: str, session: Session) -> bool:
    statement = select(Role).join(UserRole).where(UserRole.user_id == user.id).where(Role.name == role_name)
    result = session.exec(statement).first()
    return result is not None

def require_role(user: User, role_name: str, session: Session):
    if not has_role(user, role_name, session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User does not have the required role: {role_name}"
        )

# Faculty APIs
@router.post("", response_model=TransportRequestRead)
def create_request(
    request_data: TransportRequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_role(current_user, "FACULTY", session)
    
    # Create Request
    db_request = TransportRequest(
        faculty_user_id=current_user.id,
        event_title=request_data.event_title,
        event_date=request_data.event_date,
        status=RequestStatus.PENDING
    )
    session.add(db_request)
    session.flush() # Get ID
    
    # Create Guests
    guests = []
    for guest_data in request_data.guests:
        guest = Guest(
            request_id=db_request.id,
            name=guest_data.name,
            pickup_location=guest_data.pickup_location,
            notes=guest_data.notes
        )
        session.add(guest)
        guests.append(guest)
    
    # Log Initial Status
    log = TransportRequestStatusLog(
        request_id=db_request.id,
        new_status=RequestStatus.PENDING,
        changed_by=current_user.id,
        note="Request created"
    )
    session.add(log)
    
    session.commit()
    session.refresh(db_request)
    # Manually populate guests for response since refresh might not load relationship immediately
    # or rely on lazy loading if session is active. 
    # But explicitly setting it ensures consistency.
    # Note: refresh(db_request) might clear guests if not eager loaded.
    # We can reload with guests.
    statement = select(TransportRequest).where(TransportRequest.id == db_request.id).options(selectinload(TransportRequest.guests))
    db_request = session.exec(statement).one()
    
    return db_request

@router.get("/my", response_model=List[TransportRequestRead])
def get_my_requests(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_role(current_user, "FACULTY", session)
    statement = select(TransportRequest).where(TransportRequest.faculty_user_id == current_user.id).options(selectinload(TransportRequest.guests)).order_by(TransportRequest.created_at.desc())
    results = session.exec(statement).all()
    return results

@router.get("/{request_id}", response_model=TransportRequestRead)
def get_request(
    request_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(TransportRequest).where(TransportRequest.id == request_id).options(selectinload(TransportRequest.guests))
    request = session.exec(statement).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    is_faculty = has_role(current_user, "FACULTY", session)
    is_to = has_role(current_user, "TRANSPORT_OFFICER", session)
    
    if is_faculty and request.faculty_user_id != current_user.id:
        if not is_to: # Faculty can only see own, TO can see all
             raise HTTPException(status_code=403, detail="Not authorized to view this request")
    
    if not (is_faculty or is_to):
         raise HTTPException(status_code=403, detail="Not authorized")

    return request

# TO APIs
@router.get("", response_model=List[TransportRequestRead])
def get_all_requests(
    status_filter: Optional[RequestStatus] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_role(current_user, "TRANSPORT_OFFICER", session)
    statement = select(TransportRequest).options(selectinload(TransportRequest.guests))
    if status_filter:
        statement = statement.where(TransportRequest.status == status_filter)
    statement = statement.order_by(TransportRequest.created_at.desc())
    return session.exec(statement).all()

@router.patch("/{request_id}/status", response_model=TransportRequestRead)
def update_status(
    request_id: UUID,
    status_update: TransportRequestUpdateStatus,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_role(current_user, "TRANSPORT_OFFICER", session)
    statement = select(TransportRequest).where(TransportRequest.id == request_id).options(selectinload(TransportRequest.guests))
    request = session.exec(statement).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    current_status = request.status
    new_status = status_update.status
    
    # Transition Rules
    valid_transitions = {
        RequestStatus.PENDING: [RequestStatus.APPROVED, RequestStatus.DECLINED],
        RequestStatus.APPROVED: [RequestStatus.ASSIGNED],
        RequestStatus.ASSIGNED: [RequestStatus.COMPLETED],
        RequestStatus.DECLINED: [], # Terminal
        RequestStatus.COMPLETED: [] # Terminal
    }
    
    if new_status not in valid_transitions.get(current_status, []):
         raise HTTPException(
            status_code=400, 
            detail=f"Invalid status transition from {current_status} to {new_status}"
        )
        
    request.status = new_status
    request.updated_at = datetime.utcnow()
    session.add(request)
    
    # Log
    log = TransportRequestStatusLog(
        request_id=request.id,
        previous_status=current_status,
        new_status=new_status,
        changed_by=current_user.id,
        note=status_update.note
    )
    session.add(log)
    
    session.commit()
    session.refresh(request)
    return request

@router.patch("/{request_id}/assign", response_model=TransportRequestRead)
def assign_request(
    request_id: UUID,
    assignment: TransportRequestAssign,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_role(current_user, "TRANSPORT_OFFICER", session)
    statement = select(TransportRequest).where(TransportRequest.id == request_id).options(selectinload(TransportRequest.guests))
    request = session.exec(statement).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if request.status != RequestStatus.APPROVED:
         raise HTTPException(status_code=400, detail="Request must be APPROVED before assignment")
    
    request.assigned_vehicle_id = assignment.assigned_vehicle_id
    request.assigned_driver_profile_id = assignment.assigned_driver_profile_id
    request.assigned_by = current_user.id
    request.assigned_at = datetime.utcnow()
    if assignment.to_reply_message:
        request.to_reply_message = assignment.to_reply_message
    
    # Auto-transition to ASSIGNED
    old_status = request.status
    request.status = RequestStatus.ASSIGNED
    
    session.add(request)
    
    # Log
    log = TransportRequestStatusLog(
        request_id=request.id,
        previous_status=old_status,
        new_status=RequestStatus.ASSIGNED,
        changed_by=current_user.id,
        note="Assigned vehicle/driver"
    )
    session.add(log)
    
    session.commit()
    session.refresh(request)
    return request
