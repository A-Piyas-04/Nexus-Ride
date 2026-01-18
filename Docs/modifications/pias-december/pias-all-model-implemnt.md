# Implementation Log: Database Models & Schemas

## 1. Summary of Changes
This session focused on implementing the complete database schema for the NexusRide system, filling in gaps from the initial plan, adding new requirements (`subscription_leave`, `token`), and organizing the codebase.

---

## 2. Implemented Models

The following models were implemented using **SQLModel** and placed in `app/models/`.

### Core Extensions
- **`StaffProfile`** & **`DriverProfile`**: Implemented to store role-specific metadata.
  - *Refactoring*: Combined into `app/models/profile.py`.
- **`Vehicle`**: Implemented in `app/models/vehicle.py`.
- **`Payment`**: Implemented in `app/models/payment.py`.
- **`Notification`**: Implemented in `app/models/notification.py`.

### Transport & Routing
- **`Route`** & **`RouteStop`**: Implemented to define transport network.
  - *Refactoring*: Combined into `app/models/route.py`.
- **`Trip`**: Implemented in `app/models/trip.py` to schedule rides.
- **`SeatAllocation`**: Implemented in `app/models/seat_allocation.py` to manage capacity.

### New Requirements (Added during session)
- **`SubscriptionLeave`**: Added to `app/models/subscription.py`. Tracks dates when a subscriber will not use the service.
- **`Token`**: Added `app/models/token.py`. Manages one-off ride bookings.

---

## 3. Code Organization & Refactoring

To maintain a clean project structure, related models were consolidated:

1.  **Profiles**: `StaffProfile` and `DriverProfile` were moved to `app/models/profile.py`.
2.  **Routes**: `Route` and `RouteStop` were moved to `app/models/route.py`.
3.  **Imports**: `app/main.py` was updated to import all new models, ensuring tables are automatically created by SQLModel on startup.

## 4. Schemas (Pydantic)

For each model, corresponding Pydantic schemas (Base, Create, Read) were created in `app/schemas/` to support future API development:

- `app/schemas/profile.py`
- `app/schemas/vehicle.py`
- `app/schemas/route.py`
- `app/schemas/trip.py`
- `app/schemas/seat_allocation.py`
- `app/schemas/payment.py`
- `app/schemas/notification.py`
- `app/schemas/token.py`
- `app/schemas/subscription.py` (Extended)

---

## 5. Verification

- Verified imports via `test_combined_models.py` script.
- Confirmed no circular dependencies or import errors.
- Existing tables (`user`, `role`, `subscription`) were preserved without modification.
