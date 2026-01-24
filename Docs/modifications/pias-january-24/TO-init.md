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

### 2.3 Subscription Request Management
#### 2.3.1 API Endpoints
- **File**: `app/api/subscription.py`
- **Get Requests (`GET /subscription/requests`)**:
  - **Logic**: Fetches all `PENDING` subscriptions.
  - **Optimization**: Uses a SQL `JOIN` between `Subscription` and `User` tables to efficiently retrieve the user's `full_name` alongside subscription details.
  - **Response**: Returns a list of `SubscriptionRead` objects including `user_name`.
- **Approve Request (`PUT /subscription/{id}/approve`)**:
  - **Logic**: Verifies TO role, checks if subscription exists and is pending, updates status to `ACTIVE`.
- **Decline Request (`PUT /subscription/{id}/decline`)**:
  - **Logic**: Verifies TO role, checks if subscription exists and is pending, updates status to `INACTIVE`.

#### 2.3.2 Data Schemas
- **File**: `app/schemas/subscription.py`
- **Changes**: Added `user_name` field to `SubscriptionRead` model to support displaying applicant names on the frontend.

## 3. Frontend Implementation

### 3.1 TO Dashboard
- **File**: `frontend/src/pages/dashboard/TODashboard.jsx`
- **Route**: `/to-dashboard`
- **Features**:
  - Replicates the standard staff dashboard layout.
  - **Exclusive Feature**: Adds a "Subscription requests" action card linking to `/subscription-requests`.
  - Retains access to standard features (Seat availability, Token purchase, etc.).

### 3.2 Subscription Requests Page
- **File**: `frontend/src/pages/dashboard/SubscriptionRequestsPage.jsx`
- **Route**: `/subscription-requests`
- **Features**:
  - **Grid Layout**: Displays pending requests as professional cards.
  - **User Info**: Shows Applicant's Full Name (fetched from DB) instead of ID.
  - **Actions**:
    - **Approve**: Activates the subscription immediately.
    - **Decline**: Prompts for confirmation, then marks subscription as INACTIVE (red styling).
  - **Visuals**: Hover effects on cards, color-coded badges (Pending), and loading states.

### 3.3 Service Layer
- **File**: `frontend/src/services/auth.js`
- **Functions Added**:
  - `getSubscriptionRequests(token)`
  - `approveSubscription(id, token)`
  - `declineSubscription(id, token)`

### 3.4 Authentication & Routing
- **File**: `frontend/src/pages/LoginPage.jsx`
  - **Logic**: Added a check during login. If the email matches the TO email, the user is redirected specifically to `/to-dashboard`.
- **File**: `frontend/src/App.jsx`
  - **Routes Added**: 
    - `/to-dashboard`
    - `/subscription-requests`

## 4. Key Files Modified
- `app/main.py` (Seeding logic)
- `app/core/to_credentials.py` (New file)
- `app/api/subscription.py` (Endpoints for TO)
- `app/schemas/subscription.py` (Schema update)
- `frontend/src/App.jsx` (Routing)
- `frontend/src/pages/LoginPage.jsx` (Redirection logic)
- `frontend/src/pages/dashboard/TODashboard.jsx` (New file)
- `frontend/src/pages/dashboard/SubscriptionRequestsPage.jsx` (New file)
- `frontend/src/services/auth.js` (API integration)
