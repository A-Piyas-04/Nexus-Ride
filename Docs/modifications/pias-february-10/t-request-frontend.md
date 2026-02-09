# Frontend Implementation - Faculty Transport Request

## Overview
This document details the frontend implementation of the Faculty Transport Request feature. The integration allows faculty members to request vehicle transport for guests directly from the unified dashboard, while maintaining role-based access control.

## Key Changes

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
**File:** `frontend/src/pages/dashboard/TransportRequestForm.jsx`
- **Purpose:** Form for creating new transport requests.
- **Features:**
  - Dynamic guest list management (Add/Remove guests).
  - Validation for required fields.
  - Integration with `createTransportRequest` service.

#### Faculty Requests List
**File:** `frontend/src/pages/dashboard/FacultyRequests.jsx`
- **Purpose:** Displays a list of requests submitted by the faculty.
- **Features:**
  - Status badges (PENDING, APPROVED, etc.).
  - Summary cards showing event title, date, and guest count.

#### Request Detail View
**File:** `frontend/src/pages/dashboard/RequestDetailPage.jsx`
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
