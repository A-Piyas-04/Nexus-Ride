from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification
from sqlmodel import Session
from typing import Any

class TokenPurchasedHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "TOKEN_PURCHASED"

    def handle(self, payload: Any, session: Session) -> None:
        user_id = payload.get("user_id")
        token_id = payload.get("token_id")
        amount = payload.get("amount")
        
        create_notification(
            session=session,
            user_id=user_id,
            title="Token Purchased",
            message=f"You have successfully purchased a token for {amount} BDT.",
            event_type=self.event_type,
            reference_type="TOKEN",
            reference_id=token_id
        )
