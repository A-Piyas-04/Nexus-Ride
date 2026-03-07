from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.security import get_current_user
from app.db.session import get_session
from app.models.role import Role, UserRole
from app.models.trip_template import TripTemplate
from app.models.user import User
from app.schemas.trip_template import TripTemplateCreate, TripTemplateRead

router = APIRouter(prefix="/trip-templates", tags=["trip-templates"])


def _require_transport_officer(current_user: User, session: Session) -> None:
    stmt = (
        select(Role)
        .join(UserRole, Role.id == UserRole.role_id)
        .where(UserRole.user_id == current_user.id)
        .where(Role.name == "TO")
    )
    if session.exec(stmt).first() is None:
        raise HTTPException(status_code=403, detail="Only Transport Officers can manage trip templates")


@router.post("", response_model=TripTemplateRead, status_code=201)
def create_trip_template(
    data: TripTemplateCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_transport_officer(current_user, session)
    template = TripTemplate(**data.model_dump())
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@router.get("", response_model=List[TripTemplateRead])
def list_trip_templates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    is_active: Optional[bool] = Query(None),
    route_id: Optional[UUID] = Query(None),
):
    _require_transport_officer(current_user, session)
    stmt = select(TripTemplate)
    if is_active is not None:
        stmt = stmt.where(TripTemplate.is_active == is_active)
    if route_id is not None:
        stmt = stmt.where(TripTemplate.route_id == route_id)
    stmt = stmt.order_by(TripTemplate.route_id, TripTemplate.start_time)
    return list(session.exec(stmt).all())


@router.put("/{template_id}", response_model=TripTemplateRead)
def update_trip_template(
    template_id: UUID,
    data: TripTemplateCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_transport_officer(current_user, session)
    template = session.get(TripTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Trip template not found")
    for key, value in data.model_dump().items():
        setattr(template, key, value)
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


@router.delete("/{template_id}", status_code=204)
def delete_trip_template(
    template_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _require_transport_officer(current_user, session)
    template = session.get(TripTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Trip template not found")
    session.delete(template)
    session.commit()
    return None
