# NexusRide API Documentation

This document outlines the available API endpoints for the NexusRide University Transport Management System.

## 1. Authentication & Users (`/auth`)

### 1.1 Staff Signup
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

### 1.2 Login (Staff & General)
- **Method**: `POST`
- **Path**: `/auth/login`
- **Description**: Authenticates a user (via email) and returns a JWT access token.
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
    "user_type": "STAFF",
    "roles": [{"id": 1, "name": "NORMAL_STAFF"}]
  }
  ```

---

## 2. Staff Management (`/staff`)

### 2.1 Get My Staff Profile
- **Method**: `GET`
- **Path**: `/staff/profile/me`
- **Description**: Retrieves extended profile details for the authenticated staff member.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "id": 1,
    "user_id": "uuid",
    "staff_code": "STAFF-1234",
    "department": "CSE",
    "email": "user@example.com",
    "mobile_number": "017...",
    "default_route_name": "Route-1",
    "default_pickup_stop_name": "Banani"
  }
  ```

### 2.2 Update Staff Profile
- **Method**: `PUT`
- **Path**: `/staff/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "full_name": "New Name",
    "department": "EEE",
    "mobile_number": "017...",
    "default_route_name": "Route-2",
    "default_pickup_stop_name": "Airport"
  }
  ```
- **Response**: `{"msg": "Updated successfully"}`

---

## 3. Driver Management (`/drivers`)

### 3.1 Driver Signup
- **Method**: `POST`
- **Path**: `/drivers/signup`
- **Description**: Registers a new driver.
- **Request Body**:
  ```json
  {
    "full_name": "Driver Name",
    "mobile_number": "017...",
    "password": "password",
    "license_number": "LIC-123"
  }
  ```

### 3.2 Driver Login
- **Method**: `POST`
- **Path**: `/drivers/login`
- **Description**: Authenticates a driver via mobile number.
- **Request Body**:
  ```json
  {
    "mobile_number": "017...",
    "password": "password"
  }
  ```

### 3.3 List Drivers (Admin/TO)
- **Method**: `GET`
- **Path**: `/drivers`
- **Response**: List of drivers with details.

### 3.4 Get Driver Profile (Me)
- **Method**: `GET`
- **Path**: `/drivers/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Driver profile details.

### 3.5 Update Driver Profile
- **Method**: `PUT`
- **Path**: `/drivers/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "full_name": "Updated Name",
    "mobile_number": "018...",
    "email": "driver@example.com"
  }
  ```

### 3.6 Approve Driver (TO)
- **Method**: `PUT`
- **Path**: `/drivers/{id}/approve`
- **Roles**: TO required (implied)
- **Description**: Approves a driver account (sets status to 1).

### 3.7 Update Driver Status
- **Method**: `PATCH`
- **Path**: `/drivers/{driver_id}/status`
- **Request Body**: `{"status": 1}`

---

## 4. Subscription Management (`/subscription`)

### 4.1 Apply for Subscription
- **Method**: `POST`
- **Path**: `/subscription/`
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
- **Response**: Created subscription object.

### 4.2 Get My Subscription
- **Method**: `GET`
- **Path**: `/subscription/`
- **Response**: Current subscription details.

### 4.3 List Subscription Requests (TO)
- **Method**: `GET`
- **Path**: `/subscription/requests`
- **Roles**: TO required.
- **Response**: List of pending subscriptions.

### 4.4 Approve/Decline Subscription (TO)
- **Method**: `PUT`
- **Path**: `/subscription/{id}/approve` or `/subscription/{id}/decline`
- **Roles**: TO required.

---

## 5. Token Management (`/token`)

### 5.1 Buy Token
- **Method**: `POST`
- **Path**: `/token/buy`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "route_id": "uuid",
    "pickup_stop_id": "uuid",
    "travel_date": "2024-03-01",
    "direction": "UP",
    "consumer_email": "optional@example.com"
  }
  ```
- **Response**: Created token object.

### 5.2 Get My Tokens
- **Method**: `GET`
- **Path**: `/token/my-tokens`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of user's tokens.

---

## 6. Routes & Stops (`/routes`)

### 6.1 Create Route (TO)
- **Method**: `POST`
- **Path**: `/routes`
- **Request Body**:
  ```json
  {
    "route_name": "Route-1",
    "is_active": true,
    "stops": [{"stop_name": "A", "sequence_number": 1}]
  }
  ```

### 6.2 List Routes
- **Method**: `GET`
- **Path**: `/routes`
- **Response**: List of routes with stops.

### 6.3 Update Route (TO)
- **Method**: `PATCH`
- **Path**: `/routes/{route_id}`
- **Request Body**: Partial route update.

### 6.4 Sync Route Stops (TO)
- **Method**: `PUT`
- **Path**: `/routes/{route_id}/stops`
- **Request Body**: List of stops to replace existing ones.

### 6.5 Get Route Stops
- **Method**: `GET`
- **Path**: `/routes/{route_id}/stops`

---

## 7. Vehicles (`/vehicles`)

### 7.1 List Vehicles
- **Method**: `GET`
- **Path**: `/vehicles`

### 7.2 Create Vehicle (TO)
- **Method**: `POST`
- **Path**: `/vehicles`
- **Request Body**: `{"vehicle_number": "NR-01", "capacity": 40}`

### 7.3 Update Vehicle (TO)
- **Method**: `PATCH`
- **Path**: `/vehicles/{id}` or `/vehicles/{id}/status`

---

## 8. Trips (`/trips`)

### 8.1 Get Trip Availability
- **Method**: `GET`
- **Path**: `/trips/availability`
- **Response**: List of trips with seat counts.

---

## 9. Faculty Transport Requests (`/transport-requests`)

### 9.1 Create Request (Faculty)
- **Method**: `POST`
- **Path**: `/transport-requests`
- **Roles**: FACULTY required.
- **Request Body**:
  ```json
  {
    "event_title": "Guest Lecture",
    "event_date": "2026-03-15",
    "guests": [
      {"name": "Dr. A", "pickup_location": "Airport", "notes": "VIP"}
    ]
  }
  ```

### 9.2 Get My Requests (Faculty)
- **Method**: `GET`
- **Path**: `/transport-requests/my`

### 9.3 List All Requests (TO)
- **Method**: `GET`
- **Path**: `/transport-requests`
- **Query**: `status_filter`

### 9.4 Update Status (TO)
- **Method**: `PATCH`
- **Path**: `/transport-requests/{id}/status`
- **Request Body**: `{"status": "APPROVED", "note": "..."}`

### 9.5 Assign Vehicle/Driver (TO)
- **Method**: `PATCH`
- **Path**: `/transport-requests/{id}/assign`
- **Request Body**:
  ```json
  {
    "assigned_vehicle_id": "uuid",
    "assigned_driver_profile_id": 123,
    "to_reply_message": "Pickup at 8:30"
  }
  ```

---

## Security Overview
- **Authentication**: JWT Bearer tokens.
- **User Types**: `STAFF`, `DRIVER`.
- **Roles**: `NORMAL_STAFF`, `FACULTY`, `TO` (Transport Officer).
- **Driver Auth**: Uses Mobile Number + Password.
- **Staff Auth**: Uses Email + Password.
