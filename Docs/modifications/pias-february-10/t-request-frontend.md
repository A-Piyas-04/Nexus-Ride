# Frontend Implementation - Faculty Transport Request

## Overview
This document details the frontend implementation of the Faculty Transport Request feature. The integration allows faculty members to request vehicle transport for guests directly from the unified dashboard, while maintaining role-based access control.

## Modifications and Refactoring (Feb 10 Updates)

### 1. Folder Restructuring
**Why?**
The initial implementation placed all request-related components directly in the `pages/dashboard` folder. As the feature grew, this cluttered the dashboard directory. To maintain better code organization and separation of concerns, we moved all transport-request specific components to a dedicated `pages/request` directory. This makes the codebase more modular and easier to navigate.

**Changes:**
- Moved `FacultyRequests.jsx` from `pages/dashboard/` to `pages/request/`.
- Moved `RequestDetailPage.jsx` from `pages/dashboard/` to `pages/request/`.
- Moved `TransportRequestForm.jsx` from `pages/dashboard/` to `pages/request/`.
- Moved `SubscriptionRequestsPage.jsx` from `pages/dashboard/` to `pages/request/`.
- Updated all relative imports in these files (e.g., `../components` became `../../components`).
- Updated `App.jsx` to import these components from their new locations.

### 2. Faculty Role Assignment Logic
**Why?**
Instead of pre-seeding dummy users, the system now supports dynamic role assignment based on a whitelist of faculty emails. This allows real user registration while ensuring specific users automatically receive the `FACULTY` role upon signup.

**Changes:**
- Created `app/seeds/faculty_emails.txt` containing allowed faculty emails.
- Refactored `app/seeds/faculty.py`:
  - Removed user seeding logic.
  - Added `get_allowed_faculty_emails()` to read the whitelist.
  - Added `assign_faculty_role_if_applicable(user, session)` to handle role assignment.
- Modified `app/api/auth.py`:
  - Integrated `assign_faculty_role_if_applicable` into the `/signup` flow.
  - Users signing up with a whitelisted email receive both `NORMAL_STAFF` and `FACULTY` roles.
- Updated `app/main.py`:
  - Removed the deprecated faculty seeding call.

### 3. Tooling Updates
**Why?**
The internal database viewer tool (`gui_db_viewer.py`) did not support the newly created tables for transport requests, making it difficult to verify data during development.

**Changes:**
- Updated `tests/db-lookup/gui_db_viewer.py`.
- Added `TransportRequest`, `Guest`, and `TransportRequestStatusLog` models to the viewer's `TABLE_MAP`.

---

## Feature Implementation Details

### 1. Dashboard Integration
**File:** `frontend/src/pages/dashboard/DashboardPage.jsx`
- **Role Detection:** Added logic to fetch user roles from `/auth/me` endpoint.
- **Conditional Rendering:** Added a "Faculty Services" section that only appears if the user has the `FACULTY` role.
- **Action Card:** Introduced a "Transport Requests" card that navigates to the request list.

### 2. Service Layer
**File:** `frontend/src/services/transport.js`
- **Purpose:** Handles API communication with the backend.
- **Functions:**
  - `createTransportRequest(data)`: POST /transport-requests
  - `getMyTransportRequests()`: GET /transport-requests/my
  - `getTransportRequestById(id)`: GET /transport-requests/{id}

### 3. UI Components

#### Transport Request Form
**File:** `frontend/src/pages/request/TransportRequestForm.jsx` (Moved from dashboard)
- **Purpose:** Form for creating new transport requests.
- **Features:**
  - Dynamic guest list management (Add/Remove guests).
  - Validation for required fields.
  - Integration with `createTransportRequest` service.

#### Faculty Requests List
**File:** `frontend/src/pages/request/FacultyRequests.jsx` (Moved from dashboard)
- **Purpose:** Displays a list of requests submitted by the faculty.
- **Features:**
  - Status badges (PENDING, APPROVED, etc.).
  - Summary cards showing event title, date, and guest count.

#### Request Detail View
**File:** `frontend/src/pages/request/RequestDetailPage.jsx` (Moved from dashboard)
- **Purpose:** Shows detailed information about a specific request.
- **Features:**
  - Full guest list with pickup locations and notes.
  - Transport Officer reply messages.
  - Assigned vehicle information (when status is ASSIGNED).

### 4. Routing
**File:** `frontend/src/App.jsx`
- **New Routes:**
  - `/dashboard/transport-requests/new`: Create new request.
  - `/dashboard/transport-requests/my`: List my requests.
  - `/dashboard/transport-requests/:id`: View request details.

## Role-Based Access Control
- The dashboard checks for the `FACULTY` role before rendering the entry point.
- Backend APIs strictly enforce role permissions, ensuring security even if frontend checks are bypassed.

## Non-Functional Aspects
- **Styling:** Reused existing `Button`, `Card`, and `Input` components for consistency.
- **Icons:** Used `lucide-react` icons (Briefcase, Truck, User) to match the existing design language.
- **Responsiveness:** Grid layouts adapt to mobile and desktop screens.
