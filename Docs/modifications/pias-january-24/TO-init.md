# Transport Officer (TO) Implementation Details

## 1. Overview
This document outlines the initial implementation of the Transport Officer (TO) role. The TO is a specialized user with administrative capabilities for managing subscriptions, routes, and vehicles. This implementation introduces a dual-role system where the TO holds both `NORMAL_STAFF` and `TO` roles.

## 2. Backend Implementation

### 2.1 Credentials Management
- **File**: `app/core/to_credentials.py`
- **Purpose**: securely stores hardcoded credentials for the initial prototype.
- **Credentials**:
  - **Email**: `transportofficer@iut-dhaka.edu`
  - **Password**: `transportofficer@iut-dhaka.edu`

### 2.2 User & Role Seeding
- **File**: `app/main.py`
- **Logic**:
  - On application startup (`lifespan` event), the system checks if the TO user exists.
  - If not found, it creates a user with:
    - `email`: `transportofficer@iut-dhaka.edu`
    - `user_type`: `STAFF`
  - **Dual Role Assignment**: The user is automatically assigned two entries in the `user_role` table:
    1. `NORMAL_STAFF` (to access basic staff features)
    2. `TO` (to access officer-specific features)

## 3. Frontend Implementation

### 3.1 TO Dashboard
- **File**: `frontend/src/pages/dashboard/TODashboard.jsx`
- **Route**: `/to-dashboard`
- **Features**:
  - Replicates the standard staff dashboard layout.
  - **Exclusive Feature**: Adds a "Subscription requests" action card.
  - Retains access to standard features:
    - Seat availability
    - Token purchase/history
    - Subscription management

### 3.2 Authentication & Routing
- **File**: `frontend/src/pages/LoginPage.jsx`
  - **Logic**: Added a check during login. If the email matches the TO email, the user is redirected specifically to `/to-dashboard` instead of the standard `/dashboard`.
- **File**: `frontend/src/App.jsx`
  - **Route Added**: `<Route path="/to-dashboard" element={<TODashboard />} />`

## 4. Key Files Modified
- `app/main.py` (Seeding logic)
- `app/core/to_credentials.py` (New file)
- `frontend/src/App.jsx` (Routing)
- `frontend/src/pages/LoginPage.jsx` (Redirection logic)
- `frontend/src/pages/dashboard/TODashboard.jsx` (New file)
