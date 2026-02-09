# Transport Officer Request Review & Assignment Implementation

**Date:** February 10, 2026  
**Author:** Ahnaf Shahriar Pias (Student ID: 220042146)  
**Feature:** Faculty Transport Request - TO Review & Assignment

## Overview
This document details the implementation of the Transport Officer (TO) frontend interface for managing faculty transport requests. The TO can now view all requests, approve/decline them, and assign vehicles and drivers to approved requests.

## Backend Modifications
Location: `app/api/transport_requests.py` & `app/schemas/transport_request.py`

1.  **New Endpoints:**
    *   `GET /transport-requests/vehicles`: Fetches available vehicles (ID, number, capacity, type).
    *   `GET /transport-requests/drivers`: Fetches available drivers (ID, full name, license number).
    *   Existing endpoints (`GET /transport-requests`, `PATCH .../status`, `PATCH .../assign`) were utilized.

2.  **Schema Updates:**
    *   Added `VehicleOption` and `DriverOption` schemas to support the dropdown selections in the frontend.

## Frontend Modifications

### 1. Dashboard Update
*   **File:** `src/pages/dashboard/TODashboard.jsx`
*   **Change:** Added a "Transport Requests" button in the "Review & Notify" section.
*   **Action:** Clicking this button navigates to `/dashboard/transport-requests/manage`.

### 2. Service Layer
*   **File:** `src/services/transport.js`
*   **Added Functions:**
    *   `getAllTransportRequests(status_filter)`: Fetches all requests with optional status filtering.
    *   `updateTransportRequestStatus(id, status, note)`: Updates status (APPROVED/DECLINED) with an optional note.
    *   `assignTransportRequest(id, data)`: Assigns vehicle and driver to an approved request.
    *   `getVehicles()`: Fetches list of vehicles.
    *   `getDrivers()`: Fetches list of drivers.

### 3. Transport Officer Request List
*   **File:** `src/pages/request/TransportOfficerRequests.jsx`
*   **Route:** `/dashboard/transport-requests/manage`
*   **Features:**
    *   Lists all transport requests.
    *   Status filtering tabs (PENDING, APPROVED, ASSIGNED, COMPLETED, DECLINED).
    *   Summary cards showing event title, date, and guest count.
    *   Clicking a card navigates to the management detail view.

### 4. Transport Officer Management Detail
*   **File:** `src/pages/request/TransportOfficerRequestDetail.jsx`
*   **Route:** `/dashboard/transport-requests/:id/manage`
*   **Features:**
    *   **View Details:** Shows event info, guest list, and current status.
    *   **Pending Actions:** TO can "Approve" or "Decline" pending requests, optionally adding a note.
    *   **Assignment Actions:** For APPROVED requests, TO can select a Vehicle and Driver from dropdowns and confirm assignment.
    *   **Completion:** TO can mark ASSIGNED requests as COMPLETED.

### 5. Routing
*   **File:** `src/App.jsx`
*   **Change:** Registered new routes for the TO pages.

## Workflow
1.  **Faculty** creates a request -> Status: `PENDING`.
2.  **TO** sees request in "Transport Requests" list.
3.  **TO** opens detail view.
4.  **TO** clicks "Approve" -> Status: `APPROVED`.
5.  **TO** sees assignment form, selects Vehicle and Driver, clicks "Confirm" -> Status: `ASSIGNED`.
6.  **Faculty** sees the assignment details (Vehicle/Driver) in their view.

## Notes
*   Vehicle type is currently hardcoded to "Bus" in the API response as the `Vehicle` model lacks a type field.
*   Driver names are fetched by joining `DriverProfile` with the `User` table.

## Bug Fixes (Post-Implementation)
*   **Role Name Mismatch:** Fixed `403 Forbidden` error by updating the backend role check from `"TRANSPORT_OFFICER"` to `"TO"` in `app/api/transport_requests.py` to match the database seeding logic (`app/seeds/roles.py`).
