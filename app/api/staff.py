from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session, select
from uuid import uuid4
import logging
import traceback

from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.models.profile import StaffProfile
from app.models.route import Route, RouteStop

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/staff", tags=["staff"])

class UpdateStaffProfileRequest(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    mobile_number: Optional[str] = None
    default_route_name: Optional[str] = None
    default_pickup_stop_name: Optional[str] = None

@router.get("/profile/me")
def get_my_staff_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        profile = session.exec(
            select(StaffProfile).where(StaffProfile.user_id == current_user.id)
        ).first()

        # Auto-create profile if missing to avoid 404 in UI
        if not profile:
            staff_code = f"STAFF-{str(uuid4())[:8]}"
            profile = StaffProfile(
                user_id=current_user.id,
                staff_code=staff_code,
                department="",
                email=current_user.email,
                mobile_number=current_user.mobile_number
            )
            session.add(profile)
            session.commit()
            session.refresh(profile)

        route_name = None
        stop_name = None
        if profile.default_route_id:
            route = session.get(Route, profile.default_route_id)
            route_name = route.route_name if route else None
        if profile.default_pickup_stop_id:
            stop = session.get(RouteStop, profile.default_pickup_stop_id)
            stop_name = stop.stop_name if stop else None

        return {
            "id": profile.id,
            "user_id": str(profile.user_id),
            "staff_code": profile.staff_code,
            "department": profile.department,
            "email": profile.email,
            "mobile_number": profile.mobile_number,
            "default_route_id": str(profile.default_route_id) if profile.default_route_id else None,
            "default_pickup_stop_id": str(profile.default_pickup_stop_id) if profile.default_pickup_stop_id else None,
            "default_route_name": route_name,
            "default_pickup_stop_name": stop_name,
        }
    except Exception as e:
        logger.error(f"Error fetching staff profile: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error fetching profile")

@router.put("/profile")
def update_staff_profile(
    data: UpdateStaffProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        logger.info(f"Updating staff profile for user {current_user.id}")
        
        profile = session.exec(
            select(StaffProfile).where(StaffProfile.user_id == current_user.id)
        ).first()

        if not profile:
            staff_code = f"STAFF-{str(uuid4())[:8]}"
            profile = StaffProfile(
                user_id=current_user.id,
                staff_code=staff_code,
                department=data.department or "",
                email=current_user.email,
                mobile_number=data.mobile_number or current_user.mobile_number
            )
            session.add(profile)
            session.flush()

        if data.full_name is not None:
            current_user.full_name = data.full_name
            session.add(current_user)

        if data.department is not None:
            profile.department = data.department

        if data.mobile_number is not None:
        # Handle empty string as None to avoid unique constraint issues if multiple users have empty string
            mobile_val = data.mobile_number.strip() if data.mobile_number else None
        
        if mobile_val:
            existing_user = session.exec(
                select(User).where(User.mobile_number == mobile_val).where(User.id != current_user.id)
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Mobile number already in use")
        
        # We need to be careful with updating mobile_number as it's a foreign key in StaffProfile
        # Update User first
        current_user.mobile_number = mobile_val
        session.add(current_user)
        session.flush() # Flush to update User table

        # Now update Profile
        # We need to refresh the profile or manually set it, but since it's a FK, 
        # just setting it should be fine as long as the parent (User) is updated.
        # However, if we change the User's mobile number, the Profile's mobile number 
        # (which is a FK to User.mobile_number) must match the new value.
        profile.mobile_number = mobile_val

        if data.default_route_name is not None:
            if not data.default_route_name:
                profile.default_route_id = None
            else:
                route = session.exec(
                    select(Route).where(Route.route_name == data.default_route_name)
                ).first()
                if not route:
                    raise HTTPException(status_code=404, detail=f"Route '{data.default_route_name}' not found")
                profile.default_route_id = route.id

        if data.default_pickup_stop_name is not None:
            if not data.default_pickup_stop_name:
                profile.default_pickup_stop_id = None
            else:
                stop = session.exec(
                    select(RouteStop).where(RouteStop.stop_name == data.default_pickup_stop_name)
                ).first()
                if not stop:
                    raise HTTPException(status_code=404, detail=f"Pickup stop '{data.default_pickup_stop_name}' not found")
                profile.default_pickup_stop_id = stop.id

        session.add(profile)
        session.commit()
        return {"msg": "Updated successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating staff profile: {str(e)}")
        logger.error(traceback.format_exc())
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )
