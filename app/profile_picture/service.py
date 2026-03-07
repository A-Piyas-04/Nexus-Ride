from typing import Union, Optional
from uuid import UUID
from sqlmodel import Session, select
from app.models.profile import StaffProfile, DriverProfile

def get_profile_by_user_id(session: Session, user_id: UUID) -> Union[StaffProfile, DriverProfile, None]:
    """
    Finds either a StaffProfile or DriverProfile for the given user_id.
    """
    # Try finding StaffProfile
    staff_profile = session.exec(select(StaffProfile).where(StaffProfile.user_id == user_id)).first()
    if staff_profile:
        return staff_profile
        
    # Try finding DriverProfile
    driver_profile = session.exec(select(DriverProfile).where(DriverProfile.user_id == user_id)).first()
    if driver_profile:
        return driver_profile
        
    return None

def save_profile_picture(
    session: Session,
    user_id: UUID,
    image_bytes: bytes,
    mime_type: str,
    filename: str
):
    """
    Saves the profile picture to the user's profile (Staff or Driver).
    """
    profile = get_profile_by_user_id(session, user_id)
    if not profile:
        raise ValueError("User profile not found")
        
    profile.profile_picture = image_bytes
    profile.profile_picture_mime = mime_type
    profile.profile_picture_filename = filename
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def get_profile_picture(session: Session, user_id: UUID):
    """
    Retrieves the profile picture for the given user_id.
    """
    profile = get_profile_by_user_id(session, user_id)
    if not profile or not profile.profile_picture:
        return None
        
    return {
        "content": profile.profile_picture,
        "mime_type": profile.profile_picture_mime
    }
