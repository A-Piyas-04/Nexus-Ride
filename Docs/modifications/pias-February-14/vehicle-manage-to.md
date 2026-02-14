# Transport Officer – Vehicle Management (End-to-End Implementation Notes)

This document explains, in an elaborated and sequential manner, how the Transport Officer (TO) vehicle management features were implemented across backend and frontend. It covers data models, APIs, routing, UI components, state updates, error handling, responsiveness, and verification steps. All relevant files and folders are referenced to help future contributors trace the implementation quickly.


## Objectives

- Provide TO the ability to:
  - View vehicles.
  - Toggle vehicle status in three states (AVAILABLE, IN_SERVICE, UNDER_REPAIR).
  - Edit vehicle number and capacity with a confirmation step.
  - Add a new vehicle and return to the list with consistent data.
- Ensure clean integration with the backend FastAPI services.
- Maintain lint cleanliness and implement a responsive UI that adapts to mobile and desktop.


## Backend Overview

Location highlights:
- `app/main.py` – FastAPI app creation and router inclusion.
- `app/api/vehicle.py` – Vehicle endpoints and role checks.
- `app/models/vehicle.py` – Vehicle database model.
- `app/schemas/vehicle.py` – Vehicle read schema.
- `app/core/security.py` – Auth helpers (JWT), `get_current_user` dependency.
- `app/seeds/roles.py` and `app/core/to_credentials.py` – Seeding of TO user and roles.

### Data Model

File: `app/models/vehicle.py`
- Fields:
  - `id` (UUID, primary key)
  - `vehicle_number` (unique)
  - `capacity` (int)
  - `status` (str: AVAILABLE / IN_SERVICE / UNDER_REPAIR)
  - `created_at` (UTC timestamp)

### Schemas

File: `app/schemas/vehicle.py`
- `VehicleRead` exposes: `id`, `vehicle_number`, `capacity`, `status`, `created_at`.

### Vehicle API

File: `app/api/vehicle.py` (router: `/vehicles`, tags: `vehicles`)
- GET `/vehicles` – List all vehicles.
- GET `/vehicles/{vehicle_id}` – Get a single vehicle by id.
- POST `/vehicles` – Create a new vehicle.
  - Payload: `{ vehicle_number: string, capacity: number }`
  - Backend assigns `status = "AVAILABLE"` automatically.
  - TO-only endpoint (role checked).
- PATCH `/vehicles/{vehicle_id}` – Partial update:
  - Payload: `{ vehicle_number?: string, capacity?: number }`
  - Enforces unique vehicle_number (400 on conflict).
  - TO-only endpoint.
- PATCH `/vehicles/{vehicle_id}/status` – Update status:
  - Payload: `{ status: "AVAILABLE" | "IN_SERVICE" | "UNDER_REPAIR" }`
  - TO-only endpoint.
- DELETE `/vehicles/{vehicle_id}` – (Exists but intentionally not used by this feature set).

#### Role Enforcement
- Utility functions in the vehicle router check that the user is `STAFF` with the `TO` role.
- Authentication uses `Authorization: Bearer <token>` header. Token is obtained via `/auth/login`.

### Router Registration

File: `app/main.py`
- Includes `vehicles_router` with `app.include_router(vehicles_router)`.
- OpenAPI exposes `/vehicles` routes in `http://localhost:8000/docs` and `/openapi.json`.


## Frontend Overview

Location highlights (Vite + React):
- `frontend/frontend/src/pages/to-pages/vehicle-manage/vehicleList.jsx` – Main list page with status toggle, edit modal, and responsive UI.
- `frontend/frontend/src/pages/to-pages/vehicle-manage/vehicleAdd.jsx` – Add vehicle form page.
- `frontend/frontend/src/services/transport.js` – API functions (GET, PATCH, POST).
- `frontend/frontend/src/App.jsx` – App routes and ProtectedRoute gates.

### API Service (transport.js)

File: `frontend/frontend/src/services/transport.js`
- Base URL: `VITE_API_URL` or `http://localhost:8000`.
- Uses `getAuthHeaders()` to inject JWT into `Authorization` header.
- Implemented APIs:
  - `getAllVehicles()` → GET `/vehicles`
  - `updateVehicleStatus(id, status)` → PATCH `/vehicles/{id}/status` with `{ status }`
  - `updateVehicle(id, data)` → PATCH `/vehicles/{id}` with changed fields only
  - `createVehicle(data)` → POST `/vehicles` with `{ vehicle_number, capacity }`


## Routing and Access Control

File: `frontend/frontend/src/App.jsx`
- Added protected routes for:
  - `/to-pages/vehicle-manage/vehicleList` → Vehicle List
  - `/to-pages/vehicle-manage/vehicleAdd` → Vehicle Add
- Both wrapped in `ProtectedRoute requiredRoles={[1, 3]}` matching project’s role mapping.

Navigation:
- The Vehicle List header includes an “Add Vehicle” button that navigates to the Add page.
- On successful creation, the Add page redirects back to the list.


## Vehicle List Page

File: `frontend/frontend/src/pages/to-pages/vehicle-manage/vehicleList.jsx`

### Fetching Data
- On mount, calls `getAllVehicles()` and stores the list in local state.
- Displays loading and error states appropriately.

### Status Toggle (3-State)
- Replaced the plain status text with three small buttons:
  - AVAILABLE (Green)
  - IN SERVICE (Amber)
  - UNDER REPAIR (Red)
- Behavior:
  - Clicking a button calls `updateVehicleStatus(id, newStatus)`.
  - On success, updates the vehicle’s `status` in local state without a full refetch.
  - On failure, shows an inline error and the previous status remains (no UI mutation beyond the error).
  - Buttons temporarily disable during the in-flight request to avoid concurrent updates.

### Edit Modal with Confirmation
- Each row/card includes an Edit button to open a modal pre-filled with `vehicle_number` and `capacity`.
- Client validation:
  - `vehicle_number` must be non-empty (trimmed).
  - `capacity` must be a positive number.
- Save flow:
  - On Save, shows a confirmation dialog (“Are you sure you want to update this vehicle?”).
  - If “Yes”, only changed fields are sent to `updateVehicle(id, payload)`.
  - On success, the updated vehicle is merged into the list state without refetch.
  - On error (e.g., duplicate number 400), displays server-provided `detail` in the modal and keeps it open.

### Responsive Layout (Mobile vs Desktop)
- Desktop (md and up): Keeps the original table layout with columns: Vehicle Number, Capacity, Status, Actions.
- Mobile (below md): Replaces the table with stacked cards:
  - Shows Vehicle Number, Capacity, the full status toggle, and the Edit button per card.
  - Ensures no horizontal scrolling and touch-friendly spacing.
- The “Add Vehicle” button is full-width on mobile and normal-sized on desktop.


## Add Vehicle Page

File: `frontend/frontend/src/pages/to-pages/vehicle-manage/vehicleAdd.jsx`
- Form fields:
  - Vehicle Number (text; trimmed, required)
  - Capacity (number; positive)
- Submission:
  - Calls `createVehicle({ vehicle_number, capacity })`.
  - On `201 Created`, redirects to the Vehicle List page.
  - The Vehicle List page refetches on mount, so the newly created vehicle appears without manual refresh.
  - Errors:
    - 400 (duplicate vehicle_number) → Shows backend `detail` to user.
    - 403 (not TO) → “Only Transport Officers can create vehicles.”
    - Network error → Generic error message; stay on form.
  - Submit button disables and shows a “Saving...” state during the request.


## Verification & Testing

### Lint & Type Checks
- Ran `npm run lint` in `frontend/frontend` after each change to ensure code quality and compliance with rules (including React hooks dependencies and unused vars).

### Backend Endpoint Visibility
- Verified OpenAPI at `http://localhost:8000/docs` and `http://localhost:8000/openapi.json` to ensure `/vehicles`, `/vehicles/{vehicle_id}`, and `/vehicles/{vehicle_id}/status` appear as expected.

### Manual API Tests
- Logged in using seeded TO credentials from `app/core/to_credentials.py`:
  - Email/Password: `transportofficer@iut-dhaka.edu`
- Performed via HTTP calls:
  - POST `/vehicles` with a new, unique `vehicle_number` to ensure 201 and presence in subsequent GET.
  - PATCH `/vehicles/{id}` with `capacity` change; verified response reflects the new capacity.
  - PATCH `/vehicles/{id}/status` to each of the 3 states; verified response matches requested state.
  - Attempted duplicate POST to confirm 400 with appropriate error message.

### UI Verification
- Confirmed:
  - Status toggle updates only the affected row/card.
  - Edit modal confirmation flow with success and error paths.
  - Add Vehicle flow: on success → redirect → list refetch shows new vehicle.
  - Responsive behavior: mobile card stack vs desktop table, no horizontal scroll, buttons remain touch-friendly.


## Errors & Problems Solved

1. Initial lint issues across various request pages and services
   - Removed unused variables/imports and added missing dependencies for hooks to ensure a clean lint run.

2. Vehicles endpoint visibility and 404 confusion
   - Verified router inclusion in `app/main.py` and endpoints in `app/api/vehicle.py`.
   - Confirmed OpenAPI presence of `/vehicles` endpoints and validated responses.

3. Frontend API alignment
   - Ensured service functions use the correct `API_URL` and authorization header.
   - Avoided redundant try/catch blocks in services to comply with lint rules and keep error surfaces clear.

4. UI State Consistency
   - Implemented optimistic, localized updates (without full refetch) for status and edit actions.
   - Ensured modal stays open on error to allow corrections, and confirms before persisting changes.

5. Responsiveness
   - Addressed mobile layout to remove horizontal scroll by swapping the table for cards below `md` breakpoint while preserving all actions.


## File & Folder Inventory (Key Changes)

Backend:
- `app/main.py` – Includes `vehicles_router`.
- `app/api/vehicle.py` – Core vehicle endpoints and TO checks.
- `app/models/vehicle.py` – Vehicle SQLModel.
- `app/schemas/vehicle.py` – VehicleRead schema.
- `app/core/security.py` – Authentication helpers (JWT extraction and user lookup).
- `app/seeds/roles.py`, `app/core/to_credentials.py` – TO user and role seeding.

Frontend:
- `frontend/frontend/src/services/transport.js`
  - `getAllVehicles`, `updateVehicleStatus`, `updateVehicle`, `createVehicle`.
- `frontend/frontend/src/pages/to-pages/vehicle-manage/vehicleList.jsx`
  - Fetch vehicles; 3-state status toggle; edit modal with confirmation; responsive table/cards.
- `frontend/frontend/src/pages/to-pages/vehicle-manage/vehicleAdd.jsx`
  - Add vehicle form with client validation and POST integration.
- `frontend/frontend/src/App.jsx`
  - Protected routes for Vehicle List and Vehicle Add.


## Notes for Future Enhancements

- Add optional toast notifications on successful create/update.
- Consider virtualized lists for very large vehicle datasets.
- Expand status options or validations if additional operational states emerge.
- Add granular unit tests and component tests to automate verification.


## Summary

The vehicle management feature for Transport Officers integrates secure backend endpoints with a responsive, UX-friendly frontend. It adheres to project conventions (auth, role checks, lint rules) and ensures data consistency through targeted state updates and simple, reliable navigation flows. The implementation is structured for maintainability, with clear separation between API services, routing, and UI logic. 
