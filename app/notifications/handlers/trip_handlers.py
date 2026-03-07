from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification
from sqlmodel import Session
from typing import Any

class TripAssignedHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "TRIP_ASSIGNED"

    def handle(self, payload: Any, session: Session) -> None:
        user_id = payload.get("driver_user_id")
        trip_id = payload.get("trip_id")
        route_name = payload.get("route_name")
        date = payload.get("date")
        
        create_notification(
            session=session,
            user_id=user_id,
            title="New Trip Assigned",
            message=f"You have been assigned a new trip on route {route_name} for {date}.",
            event_type=self.event_type,
            reference_type="TRIP",
            reference_id=trip_id
        )
