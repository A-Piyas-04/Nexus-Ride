from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.route import Route, RouteStop
from app.schemas.route import RouteCreate, RouteRead, RouteWithStopsRead, RouteStopCreate, RouteUpdate

router = APIRouter(prefix="/routes", tags=["routes"])

# Helper to check role
def has_role(user: User, role_name: str, session: Session) -> bool:
    statement = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user.id)
        .where(Role.name == role_name)
    )
    result = session.exec(statement).first()
    return result is not None

def require_transport_officer(user: User, session: Session):
    if user.user_type != "STAFF" or not has_role(user, "TO", session):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Transport Officers (STAFF with TO role) can perform this action."
        )


# @router.get("/", response_model=list[RouteRead])
# def get_routes(session: Session = Depends(get_session)):
#     return session.exec(select(Route).where(Route.is_active == True)).all()



@router.get("", response_model=List[RouteWithStopsRead])
def get_routes(
    session: Session = Depends(get_session)
):
    statement = select(Route).options(selectinload(Route.stops))
    return session.exec(statement).all()



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



@router.get("/{route_id}", response_model=RouteWithStopsRead)
def get_route(
    route_id: UUID,
    session: Session = Depends(get_session)
):
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
    route_data: RouteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    require_transport_officer(current_user, session)
    
    db_route = session.get(Route, route_id)
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    update_data = route_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_route, key, value)
    
    session.add(db_route)
    session.commit()
    session.refresh(db_route)
    
    # Reload with stops
    statement = select(Route).where(Route.id == db_route.id).options(selectinload(Route.stops))
    return session.exec(statement).one()

@router.put("/{route_id}/stops", response_model=RouteWithStopsRead)
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
    
    # Check for unique stop names (globally) among the NEW stops
    # We need to exclude stops that currently belong to THIS route if we were doing an intelligent update,
    # but since we are deleting and re-creating (standard sync pattern), we must be careful.
    
    # Actually, a safer way is to:
    # 1. Identify existing stops for this route
    # 2. Check if any NEW stop name exists elsewhere in the DB (not in this route)
    
    existing_stops = db_route.stops
    existing_stop_ids = {s.id for s in existing_stops}
    existing_stop_names = {s.stop_name for s in existing_stops}
    
    for stop_data in stops_data:
        # If the name is NOT in this route's current names, check if it exists elsewhere
        if stop_data.stop_name not in existing_stop_names:
            other_stop = session.exec(
                select(RouteStop).where(RouteStop.stop_name == stop_data.stop_name)
            ).first()
            if other_stop:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stop with name '{stop_data.stop_name}' already exists in another route."
                )

    # Delete existing stops for this route
    from sqlmodel import delete
    session.exec(delete(RouteStop).where(RouteStop.route_id == route_id))
    
    # Add new stops
    for stop_data in stops_data:
        db_stop = RouteStop(
            route_id=route_id,
            stop_name=stop_data.stop_name,
            sequence_number=stop_data.sequence_number
        )
        session.add(db_stop)
    
    session.commit()
    
    return get_route(route_id, session)
