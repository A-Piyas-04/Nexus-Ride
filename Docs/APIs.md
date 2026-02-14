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

---

## Security Overview
- Authentication: JWT Bearer tokens via `/auth/login`; send `Authorization: Bearer <token>`.
- User types: `STAFF` and `DRIVER`. Most endpoints below expect authenticated `STAFF`.
- Roles used:
  - `NORMAL_STAFF` (default at signup)
  - `FACULTY` (Faculty features)
  - `TO` (Transport Officer, administrative)
- Common status codes: 400, 401, 403, 404, 409, 500.

---

## 4. Routes (`/routes`)
- Audience: Transport Officer (TO) for create/update; listing/get for any authenticated user.
- Schemas: [route.py](file:///e:/Projects/NexusRide/app/schemas/route.py)

### 4.1 Create Route
- Method: `POST`
- Path: `/routes`
- Roles: TO required
- Request Body (RouteCreate):
  ```json
  {
    "route_name": "Route-1",
    "is_active": true,
    "stops": [
      {"stop_name": "Banani", "sequence_number": 1},
      {"stop_name": "Tongi Station Road", "sequence_number": 2}
    ]
  }
  ```
- Response: `RouteWithStopsRead`
- Notes:
  - `route_name` must be unique.
  - Each `stop_name` must be globally unique across all routes.

### 4.2 List Routes
- Method: `GET`
- Path: `/routes`
- Response: `List<RouteWithStopsRead>`

### 4.3 Get Route By ID
- Method: `GET`
- Path: `/routes/{route_id}`
- Response: `RouteWithStopsRead`
- Errors: `404` if not found.

### 4.4 Add Stop to Route
- Method: `POST`
- Path: `/routes/{route_id}/stops`
- Roles: TO required
- Request Body:
  ```json
  {"stop_name": "Airport", "sequence_number": 3}
  ```
- Response: Updated `RouteWithStopsRead`
- Errors: `400` if stop name already exists globally; `404` if route missing.

### 4.5 Update Route Metadata
- Method: `PATCH`
- Path: `/routes/{route_id}`
- Roles: TO required
- Request Body (partial):
  ```json
  {"route_name": "Route-A", "is_active": false}
  ```
- Response: `RouteWithStopsRead`

### 4.6 Sync Route Stops (Replace All)
- Method: `PUT`
- Path: `/routes/{route_id}/stops`
- Roles: TO required
- Request Body: `List<RouteStopCreate>`
- Behavior: Deletes existing stops and creates provided ones. Validates stop names do not exist in other routes.
- Response: `RouteWithStopsRead`

---

## 5. Vehicles (`/vehicles`)
- Audience: TO for create/update/delete; list/get for any authenticated user.
- Schemas: [vehicle.py](file:///e:/Projects/NexusRide/app/schemas/vehicle.py)

### 5.1 List Vehicles
- Method: `GET`
- Path: `/vehicles`
- Response: `List<VehicleRead>`

### 5.2 Get Vehicle
- Method: `GET`
- Path: `/vehicles/{vehicle_id}`
- Response: `VehicleRead`
- Errors: `404` if not found.

### 5.3 Create Vehicle
- Method: `POST`
- Path: `/vehicles`
- Roles: TO required
- Request Body:
  ```json
  {"vehicle_number": "NR-208", "capacity": 32}
  ```
- Response: `VehicleRead` (with `status` default `AVAILABLE`)
- Errors: `400` if `vehicle_number` already exists.

### 5.4 Update Vehicle Status
- Method: `PATCH`
- Path: `/vehicles/{vehicle_id}/status`
- Roles: TO required
- Request Body:
  ```json
  {"status": "AVAILABLE"}  // AVAILABLE | IN_SERVICE | UNDER_REPAIR
  ```
- Response: `VehicleRead`

### 5.5 Update Vehicle (Partial)
- Method: `PATCH`
- Path: `/vehicles/{vehicle_id}`
- Roles: TO required
- Request Body (partial):
  ```json
  {"vehicle_number": "NR-300", "capacity": 40}
  ```
- Response: `VehicleRead`
- Errors: `400` if new `vehicle_number` duplicates existing one.

### 5.6 Delete Vehicle
- Method: `DELETE`
- Path: `/vehicles/{vehicle_id}`
- Roles: TO required
- Response: `204 No Content`
- Errors:
  - `409` if vehicle is assigned to an active trip (`SCHEDULED`/`STARTED`)
  - `409` if vehicle is assigned to a driver

---

## 6. Faculty Transport Requests (`/transport-requests`)
- Audience:
  - Faculty: create and view own requests.
  - TO: view all, update status, assign vehicles/drivers, and list options.
- Schemas: [transport_request.py](file:///e:/Projects/NexusRide/app/schemas/transport_request.py)

### 6.1 Create Request (Faculty)
- Method: `POST`
- Path: `/transport-requests`
- Roles: FACULTY required
- Request Body:
  ```json
  {
    "event_title": "Guest Lecture",
    "event_date": "2026-03-15",
    "guests": [
      {"name": "Dr. A", "pickup_location": "Airport", "notes": "VIP"},
      {"name": "Ms. B", "pickup_location": "Hotel Plaza"}
    ]
  }
  ```
- Response: `TransportRequestRead`

### 6.2 Get My Requests (Faculty)
- Method: `GET`
- Path: `/transport-requests/my`
- Roles: FACULTY required
- Response: `List<TransportRequestRead>` ordered by `created_at` desc.

### 6.3 Get Request by ID
- Method: `GET`
- Path: `/transport-requests/{request_id}`
- Roles: FACULTY (own only) or TO
- Response: `TransportRequestRead`
- Errors: `404` if not found, `403` if not authorized.

### 6.4 List All Requests (TO)
- Method: `GET`
- Path: `/transport-requests`
- Roles: TO required
- Query: `status_filter` optional: `PENDING|APPROVED|DECLINED|ASSIGNED|COMPLETED`
- Response: `List<TransportRequestRead>`

### 6.5 Update Status (TO)
- Method: `PATCH`
- Path: `/transport-requests/{request_id}/status`
- Roles: TO required
- Request Body:
  ```json
  {"status": "APPROVED", "note": "Approved for logistics"}
  ```
- Response: `TransportRequestRead`
- Transition Rules:
  - `PENDING` → `APPROVED` | `DECLINED`
  - `APPROVED` → `ASSIGNED`
  - `ASSIGNED` → `COMPLETED`
  - `DECLINED`, `COMPLETED` are terminal.

### 6.6 Vehicle Options (TO)
- Method: `GET`
- Path: `/transport-requests/vehicles`
- Roles: TO required
- Response: `List<VehicleOption>`

### 6.7 Driver Options (TO)
- Method: `GET`
- Path: `/transport-requests/drivers`
- Roles: TO required
- Response: `List<DriverOption>`

### 6.8 Assign Vehicle/Driver (TO)
- Method: `PATCH`
- Path: `/transport-requests/{request_id}/assign`
- Roles: TO required
- Request Body:
  ```json
  {
    "assigned_vehicle_id": "uuid",
    "assigned_driver_profile_id": 123,
    "to_reply_message": "Pickup at 8:30 AM"
  }
  ```
- Response: `TransportRequestRead` (auto-transitions to `ASSIGNED`)

---

## Code References
- Users: [user.py](file:///e:/Projects/NexusRide/app/models/user.py)
- Roles: [role.py](file:///e:/Projects/NexusRide/app/models/role.py)
- Subscriptions: [subscription.py](file:///e:/Projects/NexusRide/app/models/subscription.py)
- Route Schemas: [route.py](file:///e:/Projects/NexusRide/app/schemas/route.py)
- Vehicle Schemas: [vehicle.py](file:///e:/Projects/NexusRide/app/schemas/vehicle.py)
- Trip Schemas: [trip.py](file:///e:/Projects/NexusRide/app/schemas/trip.py)
- Transport Request Schemas: [transport_request.py](file:///e:/Projects/NexusRide/app/schemas/transport_request.py)
