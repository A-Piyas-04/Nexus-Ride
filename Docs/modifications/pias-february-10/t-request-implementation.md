# Faculty Transport Request Implementation Details

**Date:** 2026-02-10
**Author:** Trae AI (on behalf of Pias)
**Status:** Implemented

## Overview
This document details the backend implementation of the Faculty Transport Request feature, including model refinements, API endpoints, role-based access control, and status transition logic. Each modification is justified to ensure maintainability, data integrity, and role security.

## 1. Database Schema Refinements

### `TransportRequest` Model
- **Status Enum**: Enforced `RequestStatus` Enum (`PENDING`, `APPROVED`, `DECLINED`, `ASSIGNED`, `COMPLETED`) for type safety.
  - **Purpose**: Prevents invalid status strings (e.g., "Pending" vs "PENDING") and ensures consistent state logic across the application.
- **Indexes**: Added indexes on `status`, `faculty_user_id`, and `created_at`.
  - **Purpose**: Optimizes common queries like "Show all pending requests" or "Show my requests," preventing full table scans as data grows.
- **Cascade Delete**: Configured `Guest` relationship to cascade delete when a request is deleted.
  - **Purpose**: Prevents orphan guest records. If a request is deleted, its associated guests are automatically removed, maintaining database cleanliness.

## 2. API Endpoints

### Base URL: `/transport-requests`

### Faculty APIs
| Method | Endpoint | Description | Role Required | Purpose |
|---|---|---|---|---|
| `POST` | `/` | Create a new transport request with guests. | `FACULTY` | Allows faculty to initiate a request. Handles both request details and guest list in a single atomic transaction. |
| `GET` | `/my` | List all requests created by the current faculty member. | `FACULTY` | Provides a dashboard view for faculty to track their request history. |
| `GET` | `/{id}` | Get details of a specific request. | `FACULTY` (Owner) or `TRANSPORT_OFFICER` | Allows viewing detailed info (guests, status history) while strictly enforcing ownership privacy. |

### Transport Officer (TO) APIs
| Method | Endpoint | Description | Role Required | Purpose |
|---|---|---|---|---|
| `GET` | `/` | List all requests (can filter by status). | `TRANSPORT_OFFICER` | Enables TO to view the incoming queue and filter by "PENDING" to see actionable items. |
| `PATCH` | `/{id}/status` | Update request status (Approve/Decline). | `TRANSPORT_OFFICER` | Separate endpoint for status changes ensures strict state transition validation and audit logging. |
| `PATCH` | `/{id}/assign` | Assign vehicle and driver to an APPROVED request. | `TRANSPORT_OFFICER` | Decouples approval from resource assignment. Ensures resources are only assigned to valid, approved requests. |

## 3. Business Logic & Rules

### Role Enforcement
- **FACULTY**: Can only create requests and view their own. Cannot modify status or assignment.
  - **Purpose**: Prevents unauthorized modifications (e.g., a faculty member approving their own request).
- **TRANSPORT_OFFICER**: Can view all requests, update status, and assign resources.
  - **Purpose**: Centralizes control of transport resources to the designated officer.

### Status Transitions
Strict state transitions are enforced in the backend:

1.  **PENDING** → **APPROVED** or **DECLINED**
2.  **APPROVED** → **ASSIGNED** (via assignment API)
3.  **ASSIGNED** → **COMPLETED** (System/Future)

*Invalid transitions (e.g., PENDING → ASSIGNED directly) result in a 400 Bad Request error.*

**Purpose**: Prevents logical errors, such as assigning a vehicle to a request that hasn't been approved yet, or reviving a declined request without a new submission.

### Audit Logging
Every status change is recorded in the `transport_request_status_log` table with:
- Previous Status
- New Status
- Changed By (User ID)
- Note (Optional)
- Timestamp

**Purpose**: Provides accountability and a timeline view. If a request is declined, the "Note" field captures the reason, and the log proves who made the decision and when.

## 4. Code Structure
- **Models**: `app/models/transport_request.py`
- **Schemas**: `app/schemas/transport_request.py` (Pydantic models)
- **API Router**: `app/api/transport_requests.py`
- **Main**: Registered router in `app/main.py`
