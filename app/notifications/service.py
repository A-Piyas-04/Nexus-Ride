from sqlmodel import Session, select
from uuid import UUID
from typing import Optional, List
from app.notifications.models import Notification

def create_notification(
    session: Session,
    user_id: UUID,
    title: str,
    message: str,
    event_type: str,
    reference_type: str,
    reference_id: Optional[UUID] = None
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        event_type=event_type,
        reference_type=reference_type,
        reference_id=reference_id
    )
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification

def get_user_notifications(
    session: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False
) -> List[Notification]:
    statement = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        statement = statement.where(Notification.is_read == False)
    statement = statement.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    return session.exec(statement).all()

def mark_notification_as_read(
    session: Session,
    notification_id: UUID,
    user_id: UUID
) -> Optional[Notification]:
    statement = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id
    )
    notification = session.exec(statement).first()
    if notification:
        notification.is_read = True
        session.add(notification)
        session.commit()
        session.refresh(notification)
    return notification

def mark_all_as_read(
    session: Session,
    user_id: UUID
) -> int:
    statement = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read == False
    )
    notifications = session.exec(statement).all()
    count = 0
    for notification in notifications:
        notification.is_read = True
        session.add(notification)
        count += 1
    session.commit()
    return count

def delete_notification(
    session: Session,
    notification_id: UUID,
    user_id: UUID
) -> bool:
    statement = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id
    )
    notification = session.exec(statement).first()
    if notification:
        session.delete(notification)
        session.commit()
        return True
    return False
