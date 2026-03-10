# NexusRide Features by User Types, Roles, and Statuses

This document explains the platform’s features and behavior derived from the core models and schemas:
- Users: [user.py](file:///e:/Projects/NexusRide/app/models/user.py)
- Roles: [role.py](file:///e:/Projects/NexusRide/app/models/role.py)
- Subscriptions: [subscription.py](file:///e:/Projects/NexusRide/app/models/subscription.py)
- Auth Schemas: [auth.py](file:///e:/Projects/NexusRide/app/schemas/auth.py)
- Subscription Schemas: [subscription.py](file:///e:/Projects/NexusRide/app/schemas/subscription.py)

## User Types
- user_type values:
  - STAFF: Default for all signups. Access to most portal features and APIs when authenticated.
  - DRIVER: Used for driver accounts (referenced by other modules like DriverProfile). Drivers primarily interact with trip operations and assignments.
- Core fields:
  - email (unique, normalized lowercase, must be @iut-dhaka.edu via schema)
  - password_hash (stored securely)
  - full_name
  - mobile_number (optional, unique)
  - last_login (updated on successful login)

## Role-Based Access Control (RBAC)
- Role: Unique role name record.
- UserRole: Many-to-many mapping between user and role.
- Default assignment:
  - On signup, every user is granted NORMAL_STAFF.
  - A seeding hook may auto-assign FACULTY depending on institutional data.
- Roles used by features:
  - NORMAL_STAFF: Baseline staff privileges.
  - FACULTY: Grants ability to create and manage Faculty Transport Requests.
  - TO (Transport Officer): Grants administrative abilities for routes, vehicles, and approval workflows.

### Transport Officer Seed
- A seeded Transport Officer account is created via the role seeding routine:
  - Email and password are defined in [to_credentials.py](file:///e:/Projects/NexusRide/app/core/to_credentials.py).
  - The seed ensures roles NORMAL_STAFF and TO are assigned (see [roles.py](file:///e:/Projects/NexusRide/app/seeds/roles.py)).

## Authentication & Profile
- Signup (POST /auth/signup)
  - Validates email domain (@iut-dhaka.edu) and password length (8–128).
  - Creates STAFF user, assigns NORMAL_STAFF, may also add FACULTY per seed rules.
- Login (POST /auth/login)
  - Validates credentials; returns JWT token; updates last_login.
- Current user (GET /auth/me)
  - Returns id, email, full_name, user_type and the roles array.

Validation details (from schemas/auth.py):
- Email normalization to lowercase and strict domain enforcement.
- Password min_length: 8, max_length: 128.
- full_name min_length: 1, max_length: 100.

## Subscription Feature (STAFF)
Data Model (models/subscription.py):
- Subscription fields:
  - id (int, PK)
  - user_id (UUID, FK to user.id)
  - stop_name (FK to route_stop.stop_name)
  - status: PENDING | PAYMENT_PENDING | ACTIVE | INACTIVE
  - start_date, end_date (date)
- SubscriptionLeave fields:
  - subscription_id (FK to subscription.id)
  - from_date, to_date, reason (optional)
 - SubscriptionPickupOverride (today-only pickup change):
   - subscription_id, date, pickup_stop_id; unique per subscription/date

Workflows:
1) Apply for a subscription (POST /subscription/)
   - Inputs: start_month (string), end_month (string), year (int), stop_name (string).
   - Validations:
     - Only STAFF can apply.
     - start_month and end_month must be numeric strings (e.g., "01").
     - start_month <= end_month.
     - stop_name must match an existing RouteStop.
     - Server computes start_date (first of start_month) and end_date (last day of end_month).
   - Behavior:
     - If an existing subscription for the user is ACTIVE or PENDING, the request is rejected.
     - Otherwise, the system either updates an existing inactive record back to PENDING or creates a new PENDING subscription.
   - Response includes route_name resolved from the selected stop’s route.

2) View my subscription (GET /subscription/)
   - Returns the current user’s subscription with route information.
   - 404 if not found.

3) Transport Officer actions
   - List pending requests (GET /subscription/requests): TO only, returns PENDING requests along with applicant names and resolved route names.
   - Approve (PUT /subscription/{id}/approve): Sets status to ACTIVE; echoes enriched subscription data.
   - Decline (PUT /subscription/{id}/decline): Sets status to INACTIVE; echoes enriched subscription data.
   - Change pickup for today (POST /subscription/change-pickup-today): Active only; stop must be on same route.
   - Get today’s pickup (GET /subscription/pickup-today): Returns override or default stop.

Statuses:
- PENDING: Newly applied or re-applied; awaits TO decision.
- ACTIVE: Approved subscription.
- INACTIVE: Declined or otherwise not active.

Important constraints and implications:
- stop_name uniqueness: The Subscription table declares `stop_name` unique. This means only one subscription row can reference a particular stop_name at a time. This global uniqueness may limit multiple users selecting the same stop concurrently; if unintended, consider revisiting this constraint.
- RouteStop uniqueness: Stops are globally unique by name; stop_name references an existing RouteStop.

SubscriptionLeave:
- Defines leave intervals against an existing subscription with optional reasons.
- Not exposed in the documented API yet; the model enables future features like pausing billing/service during leave windows.

## Driver Trip Operations
Data Model (models/trip.py):
- Trip fields:
  - id (UUID, PK)
  - vehicle_id (UUID, FK → vehicle.id)
  - driver_profile_id (int, FK → driver_profile.id)
  - route_id (UUID, FK → route.id)
  - direction: TO_IUT | FROM_IUT
  - trip_date (date)
  - start_time (time)
  - started_at (datetime, set on start)
  - status: SCHEDULED | STARTED | COMPLETED

 APIs and behavior:
- Get my trips (GET `/drivers/my-trips`) — returns all trips assigned to the authenticated driver (see [drivers.py](file:///e:/Projects/NexusRide/app/api/drivers.py)).
- Start a trip (PATCH `/trips/{trip_id}/start`) — only the assigned driver can start; validates legal state transition (see [trips.py](file:///e:/Projects/NexusRide/app/api/trips.py#L108)).
- Complete a trip (PATCH `/trips/{trip_id}/complete`) — only the assigned driver can complete; requires all route stops to be marked departed.
- Stop progress (GET `/trips/{trip_id}/progress`) — per-stop arrived/departed timestamps.
- Mark stop arrived/departed (PATCH `/trips/{trip_id}/stops/{route_stop_id}/arrived|departed`) — enforces route sequence.
- Passenger list (GET `/trips/{trip_id}/passengers`) — seat allocations + ACTIVE subscribers for route/date.
- Live tracking (GET `/trips/tracking`, GET `/trips/tracking/stream`) — events for relevant trips.

Frontend:
- Driver Dashboard shows “Today’s Trips” with Start/Complete actions (see [DriverDashboard.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/dashboard/DriverDashboard.jsx)).
- A dedicated “All Assigned Trips” page lists every assigned trip irrespective of date (see [DriverTrips.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/dashboard/DriverTrips.jsx)). Route: `/driver/all-trips`.

## Trip Scheduling (Transport Officer)
UI:
- The Transport Officer dashboard includes a “Schedule Trip” action that opens a modal to schedule trips (see [TODashboard.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/dashboard/TODashboard.jsx) and [ScheduleTripModal.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/modals/ScheduleTripModal.jsx)).
- The modal presents selectable names for Route, Vehicle, and Driver (not raw IDs). The UI fetches:
  - Routes from `/routes`
  - Vehicles from `/vehicles`
  - Drivers from `/drivers`
  - Selected values populate the IDs in the payload when creating a trip.

Backend:
- Create trip (POST `/trips/`) — creates a scheduled trip with the selected route, vehicle, driver, direction, date, and start_time (see [trips.py](file:///e:/Projects/NexusRide/app/api/trips.py#L63)).

## Token & Payment Flow
Model:
- Payment fields and enums are defined in [payment.py](file:///e:/Projects/NexusRide/app/models/payment.py).
- Methods: BKASH | NAGAD | UPAY
- Statuses: INITIATED | SUCCESS | FAILED | CANCELLED | REFUNDED

Flow:
- Buying a token initiates a Payment with status `INITIATED` rather than directly creating a Token.
- A separate confirmation step finalizes the payment; on `SUCCESS`, the system finalizes the reference (e.g., creates the token).
- Tests demonstrate this sequence in the repository’s `tests` folder (e.g., token and payment tests).

## Feature Matrix by Role
- NORMAL_STAFF:
  - Authenticate and access staff endpoints.
  - Apply for and view subscription.
  - View trip availability.
- FACULTY:
  - All NORMAL_STAFF capabilities.
  - Create and manage own Faculty Transport Requests (see transport-requests APIs).
- TO (Transport Officer):
  - Approve/decline subscription requests.
  - Manage routes (create, add/sync stops, update).
  - Manage vehicles (create, update status/metadata, delete with guardrails).
  - Oversee Faculty Transport Requests (list, filter, update status, assign).
  - Schedule trips (create trip with route, vehicle, driver, direction, date, time).
- DRIVER:
  - View all assigned trips (GET `/drivers/my-trips`) and “Today’s Trips” in dashboard.
  - Start and complete trips (PATCH `/trips/{id}/start`, `/trips/{id}/complete`) for trips assigned to them.

## Data Integrity Highlights
- **Email/Mobile**: Normalized and unique constraints.
- **Validation**:
  - Email domain enforcement (@iut-dhaka.edu for staff).
  - Mobile number validation (Bangladeshi format).
- **Status Workflows**: Strict transitions for transport requests (e.g., cannot assign before approval).
- **Trip Direction Domain**: Backend uses `TO_IUT` / `FROM_IUT`; frontend may send `UP` / `DOWN` which is normalized server-side.
- **Driver Trip Authorization**: Start/Complete operations restricted to the assigned driver profile.

## References
- [user.py](file:///e:/Projects/NexusRide/app/models/user.py)
- [role.py](file:///e:/Projects/NexusRide/app/models/role.py)
- [subscription.py](file:///e:/Projects/NexusRide/app/models/subscription.py)
- [token.py](file:///e:/Projects/NexusRide/app/models/token.py)
- [transport_request.py](file:///e:/Projects/NexusRide/app/models/transport_request.py)
- [trip.py](file:///e:/Projects/NexusRide/app/models/trip.py)
- [drivers.py](file:///e:/Projects/NexusRide/app/api/drivers.py)
- [trips.py](file:///e:/Projects/NexusRide/app/api/trips.py)
- [payment.py](file:///e:/Projects/NexusRide/app/models/payment.py)
