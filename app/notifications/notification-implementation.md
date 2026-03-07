# Notification System

The Notification System is a modular, event-driven component designed to handle user notifications across the NexusRide platform. It decouples notification logic from core business domains (Subscriptions, Trips, Payments) using an Event Bus architecture, adhering to the Open/Closed Principle (OCP).

## Overview

This system allows any part of the application to emit events without knowing how they are handled. Listeners (Handlers) are registered automatically and process these events to create user notifications.

### Key Features
- **Event-Driven**: Uses an in-memory Event Bus.
- **Auto-Discovery**: Handlers are automatically discovered and registered at startup.
- **Extensible**: New notification types can be added by simply creating a new handler class file.
- **Independent**: Does not modify existing domain models or logic significantly.

## Directory Structure

The module is self-contained within `app/notifications/`:

```
app/notifications/
├── handlers/               # Event handlers directory
│   ├── __init__.py
│   ├── subscription_handlers.py  # Handles subscription events
│   ├── token_handlers.py         # Handles token purchase events
│   └── trip_handlers.py          # Handles trip assignment events
├── __init__.py
├── base_handler.py         # Abstract Base Class for handlers
├── event_bus.py            # Singleton Event Bus implementation
├── jobs.py                 # Background jobs (reminders, etc.)
├── models.py               # Database model (Notification)
├── registry.py             # Auto-discovery logic for handlers
├── router.py               # FastAPI Router definition
├── schemas.py              # Pydantic schemas for API
└── service.py              # Business logic for notifications
```

## Modified Files (Integration)

The following existing files were modified to integrate the notification system:

1.  **`app/main.py`**:
    -   Imported and registered the notification router (`/notifications`).
    -   Called `discover_handlers()` during application startup (`lifespan`).

2.  **`app/api/subscription.py`**:
    -   Added event emission for `SUBSCRIPTION_APPROVED`.

3.  **`app/api/payment.py`**:
    -   Added event emission for `TOKEN_PURCHASED` (upon successful payment confirmation).

4.  **`app/api/transport_requests.py`**:
    -   Added event emission for `TRIP_ASSIGNED` (when a TO assigns a vehicle/driver).

5.  **`app/services/scheduler.py`**:
    -   Prepared integration for background notification jobs (currently commented out).

## Key Components

### 1. Event Bus (`event_bus.py`)
A singleton class that manages event subscriptions.
- `emit(event_type, payload, session)`: Trigger an event.
- `register(handler)`: Subscribe a handler to an event.

### 2. Handler Registry (`registry.py`)
Scans the `app/notifications/handlers` package at startup to find all classes inheriting from `NotificationHandler` and registers them with the Event Bus.

### 3. Base Handler (`base_handler.py`)
Defines the contract for all notification handlers:
```python
class NotificationHandler(ABC):
    @property
    @abstractmethod
    def event_type(self) -> str:
        pass

    @abstractmethod
    def handle(self, payload: Any, session: Session) -> None:
        pass
```

### 4. Service (`service.py`)
Encapsulates database operations:
- `create_notification`
- `get_user_notifications`
- `mark_notification_as_read`
- `mark_all_as_read`
- `delete_notification`

## Integration Points

### Emitting Events
Core modules emit events using the Event Bus. This is the only "modification" allowed in the core domains.

**Example (Subscription Approval):**
```python
# app/api/subscription.py
from app.notifications.event_bus import event_bus
event_bus.emit("SUBSCRIPTION_APPROVED", subscription, session)
```

### Startup Registration
The system initializes in `app/main.py`:
```python
from app.notifications.registry import discover_handlers

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ...
    discover_handlers() # Scans and registers handlers
    # ...
```

## API Reference

Base Path: `/notifications`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get current user's notifications (paginated). |
| `PATCH` | `/{id}/read` | Mark a specific notification as read. |
| `PATCH` | `/read-all` | Mark all notifications as read. |
| `DELETE` | `/{id}` | Delete a notification. |

## Adding a New Notification

To add a new notification (e.g., "Payment Failed"), simply create a new file in `app/notifications/handlers/`:

**File:** `app/notifications/handlers/payment_handlers.py`
```python
from app.notifications.base_handler import NotificationHandler
from app.notifications.service import create_notification

class PaymentFailedHandler(NotificationHandler):
    @property
    def event_type(self) -> str:
        return "PAYMENT_FAILED"

    def handle(self, payload: Any, session: Session) -> None:
        create_notification(
            session=session,
            user_id=payload.user_id,
            title="Payment Failed",
            message="Your payment could not be processed.",
            event_type=self.event_type,
            reference_type="PAYMENT",
            reference_id=payload.id
        )
```
**No other code changes are required.** The registry will automatically find and use this handler.
