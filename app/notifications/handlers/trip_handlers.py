import logging
from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification
from sqlmodel import Session, select
from typing import Any
from uuid import UUID

logger = logging.getLogger(__name__)


class TripAssignedHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "TRIP_ASSIGNED"

    def handle(self, payload: Any, session: Session) -> None:
        # payload is expected to be a TransportRequest object or a dict

        # Determine if payload is an object or dict
        if hasattr(payload, 'id'):
            # It's an object (TransportRequest)
            request = payload
            trip_id = request.id
            driver_profile_id = request.assigned_driver_profile_id
            route_name = "Custom Request"  # Transport Requests don't have a fixed route name usually
            event_date = request.event_date
        else:
            # It's a dict
            trip_id = payload.get("trip_id") or payload.get("id")
            driver_profile_id = payload.get("assigned_driver_profile_id")
            route_name = payload.get("route_name", "Custom Request")
            event_date = payload.get("event_date")

        if driver_profile_id is None:
            return

        # DriverProfile.id is int; coerce in case payload has string (e.g. from serialization)
        try:
            driver_profile_id = int(driver_profile_id)
        except (TypeError, ValueError):
            logger.warning("TRIP_ASSIGNED: invalid assigned_driver_profile_id=%s", driver_profile_id)
            return

        # Find the driver's user_id
        from app.models.profile import DriverProfile
        driver = session.get(DriverProfile, driver_profile_id)

        if not driver:
            logger.warning("TRIP_ASSIGNED: DriverProfile id=%s not found", driver_profile_id)
            return

        user_id = driver.user_id

        create_notification(
            session=session,
            user_id=user_id,
            title="New Trip Assigned",
            message=f"You have been assigned a new transport request for {event_date}.",
            event_type=self.event_type,
            reference_type="TRANSPORT_REQUEST",
            reference_id=str(trip_id)
        )
