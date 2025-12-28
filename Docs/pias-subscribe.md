# Subscription Feature Implementation Documentation

This document details the backend implementation of the subscription feature for Staff users in the NexusRide application.

## 1. Database Schema Changes

### User Model (`app/models/user.py`)
- **Added Field**: `last_login` (DateTime, Optional)
- **Purpose**: To track the last successful login timestamp of the user, as required for audit and status verification.
- **Updated Definition**:
  ```python
  class User(SQLModel, table=True):
      ...
      last_login: Optional[datetime] = Field(default=None)
  ```

### Subscription Model (`app/models/subscription.py`)
- **Existing Structure** (utilized as is):
  - `id`: Integer Primary Key
  - `user_id`: UUID Foreign Key to User
  - `status`: String (PENDING, ACTIVE, EXPIRED)
  - `start_date`: Date
  - `end_date`: Date

## 2. API Implementation

### Authentication (`app/api/auth.py`)
- **Login Endpoint** (`POST /auth/login`):
  - **Modification**: Now updates the `last_login` field of the user upon successful password verification.
  - **Logic**:
    1. Verify credentials.
    2. If valid, set `user.last_login = datetime.utcnow()`.
    3. Commit changes to DB.
    4. Generate and return JWT access token.

### Security Core (`app/core/security.py`)
- **Enhancement**: Improved UUID handling in JWT payload.
- **Change**: Explicitly converts the `sub` claim (user ID string) from the JWT token back to a `UUID` object before querying the database. This prevents `AttributeError: 'str' object has no attribute 'hex'` when using SQLite with SQLModel/SQLAlchemy.

### Subscription API (`app/api/subscription.py`)
New endpoints were created to manage the subscription lifecycle. All endpoints require authentication (`get_current_user`).

#### 1. Subscribe (`POST /subscription/`)
- **Access**: Staff users only.
- **Logic**:
  - Checks if a subscription already exists for the user.
  - If existing subscription is `ACTIVE` or `PENDING`, returns `400 Bad Request`.
  - If existing but not active (e.g., EXPIRED or cancelled state logic if added later), or if new, creates/updates subscription to `PENDING` status.
  - Sets `start_date` to today.
- **Response**: Returns the created/updated subscription object.

#### 2. Get Subscription (`GET /subscription/`)
- **Access**: Authenticated User.
- **Logic**: Retrieves the subscription associated with the current user.
- **Response**: Subscription details or `404 Not Found`.

#### 3. Update Subscription (`PUT /subscription/`)
- **Access**: Authenticated User.
- **Parameters**: `status_update` (query parameter).
- **Logic**:
  - Validates `status_update` is one of: "PENDING", "ACTIVE", "EXPIRED".
  - Updates the status of the user's subscription.
- **Response**: Updated subscription object.

#### 4. Delete Subscription (`DELETE /subscription/`)
- **Access**: Authenticated User.
- **Logic**: Permanently removes the subscription record from the database.
- **Response**: `204 No Content`.

## 3. Testing and Verification

A comprehensive test script (`tests/test_workflow.py`) was created to validate the entire workflow.

### Test Workflow
1. **Signup**: Created a new Staff user. Verified 200 OK and DB record creation.
2. **Login**: Authenticated the user. Verified 200 OK, JWT token receipt, and `last_login` timestamp update in DB.
3. **Subscription Lifecycle**:
   - **GET (Initial)**: Verified 404 (no subscription).
   - **POST**: Created subscription. Verified 200 OK and status `PENDING` in DB.
   - **PUT**: Updated status to `ACTIVE`. Verified 200 OK and status change in DB.
   - **DELETE**: Removed subscription. Verified 204 No Content and record removal from DB.

### Verification Results
All tests passed successfully using a local SQLite test database, confirming the integrity of the schema, API logic, and database operations.

## 4. Security Considerations
- **SQL Injection Prevention**: All database queries use SQLModel/SQLAlchemy ORM, which automatically parameterizes queries to prevent SQL injection.
- **Authentication**: Endpoints are protected using OAuth2 with JWT tokens.
- **Role-Based Access Control**: The subscribe endpoint enforces `user_type == "STAFF"` check.
