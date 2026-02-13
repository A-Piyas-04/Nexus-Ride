# Modification Log - February 13, 2026

## Overview
Implemented a dynamic Route and Route Stop management system that allows authorized Transport Officers (STAFF with TO role) to add and manage routes via API endpoints. This complements the existing seeding logic while providing real-time management capabilities.

## Changes

### 1. Database Models
**File:** [route.py](file:///e%3A/Projects/NexusRide/app/models/route.py)
- **Modifications:**
    - Added `Relationship` between `Route` and `RouteStop`.
    - `Route` model now has a `stops` relationship (back-populated by `RouteStop.route`).
    - `RouteStop` model now has a `route` relationship (back-populated by `Route.stops`).
- **Rationale:** Enables efficient eager loading of stops when fetching routes, improving API performance and simplifying nested data handling.

### 2. API Schemas
**File:** [route.py](file:///e%3A/Projects/NexusRide/app/schemas/route.py)
- **Additions:**
    - `RouteWithStopsRead`: A response schema that includes nested stop information.
    - Updated `RouteCreate`: Now accepts an optional list of `stops` for bulk creation.
- **Rationale:** Provides a clear structure for creating and reading routes with their associated stops in a single request.

### 3. API Endpoints
**File:** [routes.py](file:///e%3A/Projects/NexusRide/app/api/routes.py)
- **Features:**
    - `POST /routes`: Create a new route with stops (Transport Officer only).
    - `GET /routes`: List all routes with stops.
    - `GET /routes/{route_id}`: Get a specific route with stops.
    - `PATCH /routes/{route_id}`: Update route details (e.g., `is_active`).
    - `PUT /routes/{route_id}/stops/sync`: Synchronize stops for a route (add/remove/reorder in bulk).
    - `PATCH /routes/stops/{stop_id}`: Update a specific stop.
    - `DELETE /routes/{route_id}`: Delete a route and its stops.
- **Security:** Enhanced `require_transport_officer` helper to enforce RBAC. Access is restricted to users who possess **both** the `NORMAL_STAFF` (ID 1) and `TO` (ID 3) roles, as verified against the `UserRole` table.

### 4. Frontend Implementation
**Location:** `frontend/frontend/src/pages/to-pages/to-add/`
- **Components:**
    - [routeAdd.jsx](file:///e%3A/Projects/NexusRide/frontend/frontend/src/pages/to-pages/to-add/routeAdd.jsx): Form for creating new routes with dynamic stoppage addition.
    - [routeList.jsx](file:///e%3A/Projects/NexusRide/frontend/frontend/src/pages/to-pages/to-add/routeList.jsx): Dashboard for viewing routes, toggling active status, and opening management modal.
    - [RouteDetailsModal.jsx](file:///e%3A/Projects/NexusRide/frontend/frontend/src/pages/to-pages/to-add/RouteDetailsModal.jsx): Modal for bulk editing stoppages (reordering, adding, deleting).
- **Service:** [routeService.js](file:///e%3A/Projects/NexusRide/frontend/frontend/src/services/routeService.js) handles all API communication.
- **Integration:** 
    - Linked from [TODashboard.jsx](file:///e%3A/Projects/NexusRide/frontend/frontend/src/pages/dashboard/TODashboard.jsx) under "Manage" section.
    - Routes registered in [App.jsx](file:///e%3A/Projects/NexusRide/frontend/frontend/src/App.jsx).

## Verification
- **Test Script:** [test_routes_api.py](file:///e%3A/Projects/NexusRide/test_routes_api.py) (New File)
- **Test Results:**
    - Verified TO login and token generation.
    - Verified route creation with nested stops.
    - Verified adding stops to existing routes.
    - Verified RBAC: Normal users receive `403 Forbidden` when attempting to add routes/stops.
    - Verified duplicate name prevention for routes and stops.

## Impact
The additions are non-breaking. The existing seeding logic in `app/seeds/routes.py` remains functional, and all new features integrate seamlessly with the existing database schema and authentication system.
