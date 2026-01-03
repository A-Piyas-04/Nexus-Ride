# API Changes & Error Fix Log

## 1. New Feature: Real-Time Seat Availability

### Requirement
"View real-time seat availability for multiple vehicles and routes" for the general staff role.

### Implementation Details
- **Endpoint**: `GET /trips/availability`
- **Access**: Authenticated Users (Staff)
- **Filters**:
  - `date_from` (Optional[date])
  - `date_to` (Optional[date])
  - `route_id` (Optional[UUID])

### Code Changes
1.  **Schema (`app/schemas/trip.py`)**:
    - Added `TripAvailabilityRead` model which extends `TripRead`.
    - Added fields: `route_name`, `vehicle_number`, `total_capacity`, `booked_seats`, `available_seats`.

2.  **API Logic (`app/api/trips.py`)**:
    - Implemented `get_trips_availability` function.
    - Joins `Trip`, `Vehicle`, and `Route` tables.
    - Calculates available seats dynamically: `available = vehicle.capacity - count(seat_allocation)`.

3.  **Router Registration (`app/main.py`)**:
    - Registered `trips_router` with prefix `/trips`.

---

## 2. Bug Fixes

### Circular Import / Import Error in `app/api/trips.py`
- **Issue**: The application failed to start with an `ImportError`.
  ```
  ImportError: cannot import name 'get_current_user' from 'app.api.auth'
  ```
- **Cause**: `get_current_user` is defined in `app/core/security.py`, not `app/api/auth.py`. `app/api/auth.py` imports it from `app/core/security.py` but it's better to import directly from the source to avoid circular dependency risks or re-export confusion.
- **Fix**: Updated the import statement in `app/api/trips.py`.
  - **Before**: `from app.api.auth import get_current_user`
  - **After**: `from app.core.security import get_current_user`

### Router Definition in `app/main.py`
- **Issue**: `NameError: name 'trips_router' is not defined`.
- **Cause**: The import statement for the new router was missing or incorrect when trying to include it in the app.
- **Fix**: Added the correct import:
  ```python
  from app.api.trips import router as trips_router
  ```
