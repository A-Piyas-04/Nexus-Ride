from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification
from sqlmodel import Session
from typing import Any

class SubscriptionApprovedHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "SUBSCRIPTION_APPROVED"

    def handle(self, payload: Any, session: Session) -> None:
        if hasattr(payload, 'id'):
            # Object
            user_id = payload.user_id
            subscription_id = payload.id
        else:
            # Dict
            user_id = payload.get("user_id")
            subscription_id = payload.get("id") or payload.get("subscription_id")

        create_notification(
            session=session,
            user_id=user_id,
            title="Subscription Approved",
            message=f"Your subscription request #{subscription_id} has been approved.",
            event_type=self.event_type,
            reference_type="SUBSCRIPTION",
            reference_id=str(subscription_id)
        )
