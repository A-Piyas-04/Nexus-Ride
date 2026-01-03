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
- **Status**: Not Implemented.

#### 4. Delete Subscription (`DELETE /subscription/`)
- **Status**: Not Implemented.

## 3. Testing and Verification

Separate test scripts are provided in `tests/` to validate individual components of the workflow.

### Test Scripts
1. **`test_signup.py`**: Verifies user registration.
2. **`test_login.py`**: Verifies authentication and token retrieval.
3. **`test_subscription_post.py`**: Verifies subscription creation.
4. **`test_subscription_get.py`**: Verifies subscription retrieval.

### Verification Results
Tests verify the integrity of the schema, API logic, and database operations for implemented features.

### Manual Testing via Swagger UI

When testing the subscription feature through the built-in Swagger UI (`/docs`), the initial behavior was that `POST /subscription/` returned `401 Unauthorized`. This behavior was expected for two reasons:

- The endpoint is protected by `get_current_user`, which requires a valid JWT access token in the `Authorization` header.
- The endpoint is also restricted to users with `user_type == "STAFF"`.

In Swagger UI, if you try to call `POST /subscription/` without first authenticating and providing a Bearer token, the request has no `Authorization` header, so the backend correctly responds with `401 Unauthorized`.

To test the endpoint without changing any internal code, we followed this flow entirely through the API:

1. Used `POST /auth/signup` (or an already existing user) to register a STAFF user.
2. Called `POST /auth/login` with that user’s credentials to obtain an `access_token`.
3. In Swagger UI, clicked the **Authorize** button and entered the token as:
   - `Bearer <access_token>`
4. After authorization, called `POST /subscription/` again from Swagger UI.

With a valid Bearer token set in Swagger’s global authorization, the request included the required `Authorization` header. The backend then:

- Loaded the current user from the token.
- Confirmed `user_type == "STAFF"`.
- Created or updated the `subscription` record with `status = "PENDING"` for that user.

This confirmed that the earlier `401 Unauthorized` response was the correct, secure behavior when no token was provided, and that no internal code changes were necessary—only correct usage of authentication in Swagger UI.

## 4. Security Considerations
- **SQL Injection Prevention**: All database queries use SQLModel/SQLAlchemy ORM, which automatically parameterizes queries to prevent SQL injection.
- **Authentication**: Endpoints are protected using OAuth2 with JWT tokens.
- **Role-Based Access Control**: The subscribe endpoint enforces `user_type == "STAFF"` check.
