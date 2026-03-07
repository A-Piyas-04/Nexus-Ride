from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification
from sqlmodel import Session
from typing import Any

class TokenPurchasedHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "TOKEN_PURCHASED"

    def handle(self, payload: Any, session: Session) -> None:
        if hasattr(payload, 'id'):
            # Object (Token)
            user_id = payload.user_id
            token_id = payload.id
            amount = "50.00" # Placeholder, token object might not have amount directly unless joined
        else:
            # Dict
            user_id = payload.get("user_id")
            token_id = payload.get("id") or payload.get("token_id")
            amount = payload.get("amount", "50.00")
        
        create_notification(
            session=session,
            user_id=user_id,
            title="Token Purchased",
            message=f"You have successfully purchased a token.",
            event_type=self.event_type,
            reference_type="TOKEN",
            reference_id=str(token_id)
        )
