# Notification System

This module implements a modular, event-driven notification system for NexusRide. It is designed to be decoupled from the core business logic, adhering to the Open/Closed Principle.

## Architecture

The system consists of:
- **Event Bus (`event_bus.py`)**: A singleton that manages event subscriptions and emission.
- **Handler Registry (`registry.py`)**: Automatically discovers and registers notification handlers.
- **Handlers (`handlers/`)**: Specific classes that handle different types of events (e.g., `TripCreatedHandler`).
- **Service (`service.py`)**: Handles database operations for notifications.
- **API (`api.py`)**: Exposes endpoints for users to fetch and manage their notifications.

## Usage

### 1. Emitting an Event

To trigger a notification, simply emit an event from anywhere in the application using the `event_bus`.

```python
from app.notifications.event_bus import event_bus

# Example: Emitting a trip created event
event_bus.emit("trip.created", {
    "trip_id": "123e4567-e89b-12d3-a456-426614174000",
    "driver_id": "987fcdeb-51a2-43c1-x987-654321098765",
    "route_name": "Route A"
})
```

### 2. Adding a New Notification Type

To handle a new type of event, create a new handler class in `app/notifications/handlers/`.

1.  Create a new file (e.g., `new_feature_handlers.py`).
2.  Define a class that inherits from `NotificationHandler`.
3.  Implement the `handle` method.

```python
# app/notifications/handlers/new_feature_handlers.py
from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification

class NewFeatureHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "new_feature.action"

    def handle(self, payload: dict, session) -> None:
        user_id = payload.get("user_id")
        # Create notification
        create_notification(
            session=session,
            user_id=user_id,
            title="New Feature Alert",
            message="Something happened!",
            event_type=self.event_type,
            reference_type="feature",
            reference_id=payload.get("id")
        )
```

The registry will automatically discover this new handler on startup. No other code changes are needed!

## API Endpoints

- `GET /notifications/`: Get user's notifications.
- `PUT /notifications/{id}/read`: Mark as read.
- `PUT /notifications/read-all`: Mark all as read.
