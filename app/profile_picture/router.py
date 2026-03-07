from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from sqlmodel import Session
from uuid import UUID

from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.profile_picture import service, utils

router = APIRouter(prefix="/profile/picture", tags=["profile-picture"])

@router.post("", status_code=status.HTTP_200_OK)
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload a profile picture for the current user.
    """
    # Validate image
    image_bytes = utils.validate_image(file)
    
    try:
        service.save_profile_picture(
            session=session,
            user_id=current_user.id,
            image_bytes=image_bytes,
            mime_type=file.content_type,
            filename=file.filename
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    return {"message": "Profile picture updated successfully"}

@router.get("/{user_id}")
def get_profile_picture(
    user_id: UUID,
    session: Session = Depends(get_session)
):
    """
    Get the profile picture for a specific user.
    """
    result = service.get_profile_picture(session, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Profile picture not found")
        
    return Response(
        content=result["content"],
        media_type=result["mime_type"]
    )
