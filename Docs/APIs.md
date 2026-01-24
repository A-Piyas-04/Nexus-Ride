# NexusRide API Documentation

This document outlines the available API endpoints for the NexusRide University Transport Management System.

## 1. Authentication & Users (`/auth`)

### 1.1 User Signup
- **Method**: `POST`
- **Path**: `/auth/signup`
- **Description**: Registers a new user as `STAFF` and assigns the `NORMAL_STAFF` role by default.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "full_name": "John Doe"
  }
  ```
- **Response**:
  ```json
  {
    "msg": "Signup successful"
  }
  ```

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Description**: Authenticates a user and returns a JWT access token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```

### 1.3 Get Current User
- **Method**: `GET`
- **Path**: `/auth/me`
- **Description**: Retrieves the profile of the currently authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "STAFF"
  }
  ```

---

## 2. Subscription Management (`/subscription`)

### 2.1 Apply for Subscription
- **Method**: `POST`
- **Path**: `/subscription/`
- **Description**: Allows a STAFF user to apply for a new monthly subscription.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "start_month": "01",
    "end_month": "06",
    "year": 2024,
    "stop_name": "Tongi Station Road"
  }
  ```
- **Response**: Returns the created `Subscription` object.

### 2.2 Get My Subscription
- **Method**: `GET`
- **Path**: `/subscription/`
- **Description**: Retrieves the current subscription details for the authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "id": 1,
    "user_id": "uuid-string",
    "stop_name": "Tongi Station Road",
    "status": "PENDING",
    "start_date": "2024-01-01",
    "end_date": "2024-06-30",
    "route_name": "Route-1"
  }
  ```

### 2.3 List Subscription Requests (TO Only)
- **Method**: `GET`
- **Path**: `/subscription/requests`
- **Description**: Lists all `PENDING` subscription requests. Accessible only by users with the **Transport Officer (TO)** role.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: A list of pending subscriptions, including the applicant's name.
  ```json
  [
    {
      "id": 1,
      "user_name": "Jane Smith",
      "stop_name": "Banani",
      "status": "PENDING",
      "start_date": "2024-02-01",
      ...
    }
  ]
  ```

### 2.4 Approve Subscription (TO Only)
- **Method**: `PUT`
- **Path**: `/subscription/{subscription_id}/approve`
- **Description**: Approves a pending subscription, setting its status to `ACTIVE`.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: The updated subscription object.

### 2.5 Decline Subscription (TO Only)
- **Method**: `PUT`
- **Path**: `/subscription/{subscription_id}/decline`
- **Description**: Declines a pending subscription, setting its status to `INACTIVE`.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: The updated subscription object.

---

## 3. Trip Operations (`/trips`)

### 3.1 Get Trip Availability
- **Method**: `GET`
- **Path**: `/trips/availability`
- **Description**: Retrieves a list of trips with real-time seat availability information.
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `date_from` (optional): Filter trips starting from this date (YYYY-MM-DD).
  - `date_to` (optional): Filter trips up to this date (YYYY-MM-DD).
  - `route_id` (optional): Filter by a specific route ID.
- **Response**:
  ```json
  [
    {
      "id": "uuid-string",
      "trip_date": "2024-01-24",
      "start_time": "07:30:00",
      "status": "STARTED",
      "route_name": "Route-1",
      "vehicle_number": "NR-208",
      "driver_name": "Shafiul Islam",
      "total_capacity": 32,
      "booked_seats": 5,
      "available_seats": 27
    }
  ]
  ```
