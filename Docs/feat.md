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
  - status: ACTIVE | PENDING | INACTIVE
  - start_date, end_date (date)
- SubscriptionLeave fields:
  - subscription_id (FK to subscription.id)
  - from_date, to_date, reason (optional)

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

## Data Integrity and Validation Highlights
- Email domain policy enforced by auth schemas; addresses normalized to lowercase.
- Unique constraints:
  - Users: email, mobile_number.
  - Roles: name.
  - RouteStop: stop_name (global uniqueness).
  - Subscription: stop_name (global uniqueness as defined; see note above).
- Date computation for subscriptions uses calendar month boundaries.

## References
- Users: [user.py](file:///e:/Projects/NexusRide/app/models/user.py)
- Roles: [role.py](file:///e:/Projects/NexusRide/app/models/role.py)
- Subscriptions: [subscription.py](file:///e:/Projects/NexusRide/app/models/subscription.py)
- Auth Schemas: [auth.py](file:///e:/Projects/NexusRide/app/schemas/auth.py)
- Subscription Schemas: [subscription.py](file:///e:/Projects/NexusRide/app/schemas/subscription.py)
