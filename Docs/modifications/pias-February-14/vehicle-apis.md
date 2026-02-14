# Vehicle APIs – Implementation Details (February 14, 2026)

This document describes the complete implementation of the Vehicle APIs, including endpoints, authorization, business rules, request/response shapes, and integration points.

## Overview
- Router file: [vehicle.py](file:///e:/Projects/NexusRide/app/api/vehicle.py)
- Mounted in: [main.py](file:///e:/Projects/NexusRide/app/main.py)
- Backed by model: [vehicle.py](file:///e:/Projects/NexusRide/app/models/vehicle.py)
- DTOs used for responses: [vehicle.py](file:///e:/Projects/NexusRide/app/schemas/vehicle.py)
- Uses common auth: [security.py](file:///e:/Projects/NexusRide/app/core/security.py) via `get_current_user`
- Follows existing RBAC helpers patterned after:
  - [routes.py](file:///e:/Projects/NexusRide/app/api/routes.py)
  - [transport_requests.py](file:///e:/Projects/NexusRide/app/api/transport_requests.py)

## Authorization & RBAC
- All read endpoints (GET) are public to authenticated context by default (no role check).
- Mutating endpoints (POST, PATCH, DELETE) require:
  - `user_type == "STAFF"`
  - User has the “TO” role (Transport Officer).
- Implementation:
  - `has_role(user, "TO", session)` resolves via [role.py](file:///e:/Projects/NexusRide/app/models/role.py) and `UserRole`.
  - `require_transport_officer` enforces STAFF + TO.

## Business Rules
- Vehicle status is one of: `AVAILABLE`, `IN_SERVICE`, `UNDER_REPAIR`.
- `vehicle_number` is unique.
- Deletion constraints (DELETE /vehicles/{vehicle_id}):
  - Must NOT be assigned to any active trip where `status ∈ {"SCHEDULED","STARTED"}` using [trip.py](file:///e:/Projects/NexusRide/app/models/trip.py).
  - Must NOT be currently assigned to any driver profile (`DriverProfile.assigned_vehicle_id`) via [profile.py](file:///e:/Projects/NexusRide/app/models/profile.py).
  - If constraints fail → HTTP 409 Conflict.

## Endpoints

### GET /vehicles
- Description: Fetch list of vehicles.
- Response: `List[VehicleRead]` (from [schemas/vehicle.py](file:///e:/Projects/NexusRide/app/schemas/vehicle.py))
- Typical 200 Response:
```json
[
  {
    "id": "6f1f2b43-8f7c-4a6f-b31f-0b6d0f7c3f1a",
    "vehicle_number": "BUS-101",
    "capacity": 40,
    "status": "AVAILABLE",
    "created_at": "2026-02-14T08:15:23.123Z"
  }
]
```

### GET /vehicles/{vehicle_id}
- Description: Fetch a single vehicle by ID.
- Params: `vehicle_id` (UUID)
- Responses:
  - 200: `VehicleRead`
  - 404: Vehicle not found

### POST /vehicles
- Description: Create a vehicle (STAFF + TO only).
- Access: RBAC enforced.
- Request Body:
```json
{
  "vehicle_number": "BUS-202",
  "capacity": 50
}
```
- Behavior:
  - `status` defaults to `"AVAILABLE"` server-side.
  - Rejects duplicate `vehicle_number` with 400.
- Responses:
  - 201: `VehicleRead`
  - 400: Duplicate `vehicle_number`
  - 403: Forbidden (RBAC)

### PATCH /vehicles/{vehicle_id}/status
- Description: Update vehicle status (STAFF + TO only).
- Request Body:
```json
{
  "status": "IN_SERVICE"
}
```
- Valid values: `AVAILABLE`, `IN_SERVICE`, `UNDER_REPAIR`
- Responses:
  - 200: `VehicleRead`
  - 403: Forbidden (RBAC)
  - 404: Vehicle not found

### PATCH /vehicles/{vehicle_id}
- Description: Partial update for `vehicle_number` and/or `capacity` (STAFF + TO only).
- Request Body (one or both fields optional):
```json
{
  "vehicle_number": "BUS-202-UPDATED",
  "capacity": 55
}
```
- Constraints:
  - If `vehicle_number` provided, it must remain unique (400 on conflict).
- Responses:
  - 200: `VehicleRead`
  - 400: Duplicate `vehicle_number`
  - 403: Forbidden (RBAC)
  - 404: Vehicle not found

### DELETE /vehicles/{vehicle_id}
- Description: Delete a vehicle (STAFF + TO only).
- Preconditions:
  - No active trip (status `SCHEDULED` or `STARTED`) with this `vehicle_id`.
  - No driver currently has `assigned_vehicle_id` matching this vehicle.
- Responses:
  - 204: No Content (success)
  - 403: Forbidden (RBAC)
  - 404: Vehicle not found
  - 409: Conflict when preconditions fail
- Conflict examples:
```json
{
  "detail": "Vehicle is assigned to an active trip and cannot be deleted"
}
```
```json
{
  "detail": "Vehicle is assigned to a driver and cannot be deleted"
}
```

## Code References
- API Router: [app/api/vehicle.py](file:///e:/Projects/NexusRide/app/api/vehicle.py)
- Inclusion in app: [app/main.py](file:///e:/Projects/NexusRide/app/main.py)
- Model: [app/models/vehicle.py](file:///e:/Projects/NexusRide/app/models/vehicle.py)
- Response Schemas: [app/schemas/vehicle.py](file:///e:/Projects/NexusRide/app/schemas/vehicle.py)
- Trip Model (conflict check): [app/models/trip.py](file:///e:/Projects/NexusRide/app/models/trip.py)
- Driver Profile Model (conflict check): [app/models/profile.py](file:///e:/Projects/NexusRide/app/models/profile.py)
- Role & UserRole Models: [app/models/role.py](file:///e:/Projects/NexusRide/app/models/role.py)

## Notes
- Status enum is enforced in the status PATCH endpoint via explicit allowed values.
- Read endpoints return `VehicleRead` records sorted by `created_at` descending for lists.
- All mutating endpoints rely on `get_current_user` for identity and on `require_transport_officer` for role checks to keep logic consistent with other modules.
