from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.role import UserRole
from app.models.route import Route, RouteStop
from app.schemas.route import (
    RouteCreate, 
    RouteRead, 
    RouteWithStopsRead, 
    RouteStopCreate,
    RouteUpdate,
    RouteStopUpdate
)

router = APIRouter(prefix="/routes", tags=["routes"])

def require_transport_officer(user: User, session: Session):
    # A user who has both roles (1 and 3) can access the route managing feature
    # Role 1: NORMAL_STAFF, Role 3: TO
    statement = (
        select(UserRole.role_id)
        .where(UserRole.user_id == user.id)
        .where(UserRole.role_id.in_([1, 3]))
    )
    user_roles = session.exec(statement).all()
    has_required_roles = set(user_roles) == {1, 3}
    
    if user.user_type != "STAFF" or not has_required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only users with both NORMAL_STAFF and TO roles can perform this action."
        )

@router.post("", response_model=RouteWithStopsRead)
def create_route(
    route_data: RouteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    # Check if route already exists
    existing_route = session.exec(
        select(Route).where(Route.route_name == route_data.route_name)
    ).first()
    if existing_route:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Route with name '{route_data.route_name}' already exists."
        )
    
    # Create Route
    db_route = Route(
        route_name=route_data.route_name,
        is_active=route_data.is_active
    )
    session.add(db_route)
    session.flush() # Get ID
    
    # Create Stops
    for stop_data in route_data.stops:
        # Check if stop name is unique globally
        existing_stop = session.exec(
            select(RouteStop).where(RouteStop.stop_name == stop_data.stop_name)
        ).first()
        if existing_stop:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stop with name '{stop_data.stop_name}' already exists."
            )

        db_stop = RouteStop(
            route_id=db_route.id,
            stop_name=stop_data.stop_name,
            sequence_number=stop_data.sequence_number
        )
        session.add(db_stop)
    
    session.commit()
    
    # Reload with stops
    statement = select(Route).where(Route.id == db_route.id).options(selectinload(Route.stops))
    return session.exec(statement).one()

@router.get("", response_model=List[RouteWithStopsRead])
def get_routes(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    statement = select(Route).options(selectinload(Route.stops))
    return session.exec(statement).all()

@router.get("/{route_id}", response_model=RouteWithStopsRead)
def get_route(
    route_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    statement = select(Route).where(Route.id == route_id).options(selectinload(Route.stops))
    route = session.exec(statement).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@router.post("/{route_id}/stops", response_model=RouteWithStopsRead)
def add_stop_to_route(
    route_id: UUID,
    stop_data: RouteStopCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    route = session.get(Route, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Check if stop name already exists
    existing_stop = session.exec(
        select(RouteStop).where(RouteStop.stop_name == stop_data.stop_name)
    ).first()
    if existing_stop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stop with name '{stop_data.stop_name}' already exists."
        )
    
    db_stop = RouteStop(
        route_id=route.id,
        stop_name=stop_data.stop_name,
        sequence_number=stop_data.sequence_number
    )
    session.add(db_stop)
    session.commit()
    
    # Return updated route
    return get_route(route.id, session)

@router.patch("/{route_id}", response_model=RouteWithStopsRead)
def update_route(
    route_id: UUID,
    route_update: RouteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    db_route = session.get(Route, route_id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    update_data = route_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_route, key, value)
    
    session.add(db_route)
    session.commit()
    return get_route(db_route.id, session)

@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(
    route_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    db_route = session.get(Route, route_id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Also delete associated stops
    stops = session.exec(select(RouteStop).where(RouteStop.route_id == route_id)).all()
    for stop in stops:
        session.delete(stop)
        
    session.delete(db_route)
    session.commit()
    return None

@router.patch("/stops/{stop_id}", response_model=RouteWithStopsRead)
def update_stop(
    stop_id: UUID,
    stop_update: RouteStopUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    db_stop = session.get(RouteStop, stop_id)
    if not db_stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    
    update_data = stop_update.model_dump(exclude_unset=True)
    
    if "stop_name" in update_data:
        # Check if another stop has this name
        existing = session.exec(
            select(RouteStop).where(RouteStop.stop_name == update_data["stop_name"]).where(RouteStop.id != stop_id)
        ).first()
        if existing:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stop with name '{update_data['stop_name']}' already exists."
            )
    
    for key, value in update_data.items():
        setattr(db_stop, key, value)
    
    session.add(db_stop)
    session.commit()
    return get_route(db_stop.route_id, session)

@router.put("/{route_id}/stops/sync", response_model=RouteWithStopsRead)
def sync_route_stops(
    route_id: UUID,
    stops_data: List[RouteStopCreate],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    db_route = session.get(Route, route_id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Get current stops
    current_stops = session.exec(select(RouteStop).where(RouteStop.route_id == route_id)).all()
    current_stop_names = {s.stop_name for s in current_stops}
    new_stop_names = {s.stop_name for s in stops_data}
    
    # 1. Delete stops that are not in the new list
    for stop in current_stops:
        if stop.stop_name not in new_stop_names:
            session.delete(stop)
    
    # 2. Update or Create stops
    for i, stop_data in enumerate(stops_data):
        # Use provided sequence_number or use the loop index (1-based)
        seq = stop_data.sequence_number if stop_data.sequence_number else i + 1
        
        existing_stop = next((s for s in current_stops if s.stop_name == stop_data.stop_name), None)
        
        if existing_stop:
            existing_stop.sequence_number = seq
            session.add(existing_stop)
        else:
            # Check if this stop name is used by ANY OTHER route
            other_existing = session.exec(
                select(RouteStop).where(RouteStop.stop_name == stop_data.stop_name).where(RouteStop.route_id != route_id)
            ).first()
            if other_existing:
                 raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stop with name '{stop_data.stop_name}' already exists in another route."
                )
            
            new_stop = RouteStop(
                route_id=route_id,
                stop_name=stop_data.stop_name,
                sequence_number=seq
            )
            session.add(new_stop)
            
    session.commit()
    return get_route(route_id, session)

@router.delete("/stops/{stop_id}", response_model=RouteWithStopsRead)
def delete_stop(
    stop_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    db_stop = session.get(RouteStop, stop_id)
    if not db_stop:
        raise HTTPException(status_code=404, detail="Stop not found")
    
    route_id = db_stop.route_id
    session.delete(db_stop)
    session.commit()
    return get_route(route_id, session)
