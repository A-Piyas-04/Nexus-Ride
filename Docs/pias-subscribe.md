# Subscription Feature Implementation Documentation

## Overview
This document details the backend implementation of the subscription feature for NexusRide. The feature allows users to subscribe to the service, enabling access to the "Sub Dashboard".

## Architecture
- **Framework**: FastAPI
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)

## Implementation Details

### 1. Authentication Dependency
**File**: `app/api/deps.py`
- **Purpose**: Validates JWT tokens and retrieves the current user.
- **Function**: `get_current_user`
- **Logic**:
  - Decodes the JWT token using `SECRET_KEY` and `ALGORITHM`.
  - Extracts the `sub` (subject/user_id) claim.
  - Fetches the user from the database.
  - Raises `401 Unauthorized` if token is invalid or user not found.

### 2. Subscription Schemas
**File**: `app/schemas/subscription.py`
- **Purpose**: Defines Pydantic models for request and response validation.
- **Models**:
  - `SubscriptionBase`: Common fields (`status`, `start_date`, `end_date`).
  - `SubscriptionCreate`: Request model for creating a subscription (currently empty as no input is required).
  - `SubscriptionRead`: Response model including `id` and `user_id`.

### 3. Subscription API Endpoints
**File**: `app/api/subscription.py`
- **Router**: `/subscription`
- **Endpoints**:

#### A. Subscribe (`POST /subscription/`)
- **Description**: Creates a new active subscription for the authenticated user.
- **Flow**:
  1. Checks if the user already has an `ACTIVE` subscription.
  2. If an active subscription exists and is not expired, returns `400 Bad Request`.
  3. If an expired "active" subscription exists, marks it as `EXPIRED`.
  4. Creates a new `Subscription` record with:
     - `status`: "ACTIVE"
     - `start_date`: Current date
     - `end_date`: Current date + 30 days
  5. Commits to the database and returns the new subscription.
- **Security**: Requires authenticated user (`get_current_user` dependency).

#### B. Get Subscription Status (`GET /subscription/`)
- **Description**: Retrieves the latest subscription status for the authenticated user.
- **Flow**:
  1. Queries the `Subscription` table for the user's ID.
  2. Orders by `id` descending to get the latest entry.
  3. Returns the subscription details.
  4. Returns `404 Not Found` if no subscription exists.
- **Security**: Requires authenticated user.

### 4. Main Application Update
**File**: `app/main.py`
- **Change**: Registered the `subscription_router` with the FastAPI application.
- **Code**:
  ```python
  from app.api.subscription import router as subscription_router
  # ...
  app.include_router(subscription_router)
  ```

## Security Measures
- **SQL Injection Prevention**: utilized `SQLModel` (which uses `SQLAlchemy` under the hood) for all database interactions. Parameter binding is handled automatically by the ORM.
- **Authentication**: All subscription endpoints are protected by `get_current_user` dependency, ensuring only valid, logged-in users can access them.
- **Validation**: Pydantic schemas enforce data types and structure for API responses.

## Future Considerations
- Implement a background task (e.g., Celery) to automatically expire subscriptions when `end_date` is passed.
- Add payment gateway integration (Stripe/PayPal) before activating the subscription.
