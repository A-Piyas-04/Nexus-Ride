from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.role import Role, UserRole
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.hashing import hash_password, verify_password
from app.core.security import create_access_token, get_current_user
from app.seeds.faculty import assign_faculty_role_if_applicable
from datetime import datetime
from app.schemas.route import RouteRead, RouteCreate
from app.models.route import Route

router = APIRouter()

@router.get("/{route_id}/stops")
def get_route_stops(route_id: UUID, session: Session = Depends(get_session)):
    return session.exec(
        select(RouteStop)
        .where(RouteStop.route_id == route_id)
        .order_by(RouteStop.sequence_number)
    ).all()
