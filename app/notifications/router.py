from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session
from typing import List
from uuid import UUID

from app.db.session import get_session
from app.core.security import get_current_user
from app.models.user import User
from app.notifications.schemas import NotificationResponse
from app.notifications import service

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    offset: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get notifications for the current user.
    """
    return service.get_user_notifications(
        session=session,
        user_id=current_user.id,
        skip=offset,
        limit=limit,
        unread_only=unread_only
    )

@router.patch("/read-all", response_model=dict)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Mark all notifications for the current user as read.
    """
    count = service.mark_all_as_read(
        session=session,
        user_id=current_user.id
    )
    return {"message": "All notifications marked as read", "count": count}

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Mark a specific notification as read.
    """
    notification = service.mark_notification_as_read(
        session=session,
        notification_id=notification_id,
        user_id=current_user.id
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a notification.
    """
    success = service.delete_notification(
        session=session,
        notification_id=notification_id,
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return None
