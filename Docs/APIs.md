# NexusRide API Documentation

This document outlines the available API endpoints for the NexusRide University Transport Management System.

## 1. Authentication & Users (`/auth`)

### 1.1 Staff Signup
- **Method**: `POST`
- **Path**: `/auth/signup`
- **Description**: Registers a new user as `STAFF` and assigns the `NORMAL_STAFF` role by default. Only `@iut-dhaka.edu` emails are accepted.
- **Request Body**:
  ```json
  {
    "email": "user@iut-dhaka.edu",
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
- **Description**: Authenticates a user (via email) and returns a JWT access token. Only `@iut-dhaka.edu` emails are accepted.
- **Request Body**:
  ```json
  {
    "email": "user@iut-dhaka.edu",
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

### 1.4 Profile Picture
#### 1.4.1 Upload Profile Picture
- **Method**: `POST`
- **Path**: `/profile/picture`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Binary file (Max 2MB, `image/jpeg`, `image/png`, `image/webp`)
- **Response**:
  ```json
  {
    "message": "Profile picture updated successfully"
  }
  ```

#### 1.4.2 Get Profile Picture
- **Method**: `GET`
- **Path**: `/profile/picture/{user_id}`
- **Response**: Binary image data with appropriate `Content-Type` header (e.g., `image/png`).

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
    "default_route_id": "uuid",
    "default_pickup_stop_id": "uuid",
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
- **Description**: Registers a new driver. Mobile number must be 11 digits and start with `01`. License format must be `DL-1234`.
- **Request Body**:
  ```json
  {
    "full_name": "Driver Name",
    "mobile_number": "017XXXXXXXX",
    "password": "password",
    "license_number": "DL-1234"
  }
  ```

### 3.2 Driver Login
- **Method**: `POST`
- **Path**: `/drivers/login`
- **Description**: Authenticates a driver via mobile number.
- **Request Body**:
  ```json
  {
    "mobile_number": "017XXXXXXXX",
    "password": "password"
  }
  ```

### 3.3 List Drivers
- **Method**: `GET`
- **Path**: `/drivers`
- **Response**: List of drivers with details.

### 3.4 Get Driver Profile (Me)
- **Method**: `GET`
- **Path**: `/drivers/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Driver profile details with assigned vehicle (if any).

### 3.5 Update Driver Profile
- **Method**: `PUT`
- **Path**: `/drivers/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "full_name": "Updated Name",
    "mobile_number": "018XXXXXXXX",
    "email": "driver@iut-dhaka.edu"
  }
  ```

### 3.6 Get Driver (By ID)
- **Method**: `GET`
- **Path**: `/drivers/{driver_id}`

### 3.7 Driver Requests (Pending Approvals)
- **Method**: `GET`
- **Path**: `/drivers/requests`

### 3.8 Update Driver Status
- **Method**: `PATCH`
- **Path**: `/drivers/{driver_id}/status`
- **Request Body**: `{"status": 1}`

### 3.9 Approve Driver
- **Method**: `PUT`
- **Path**: `/drivers/{id}/approve`
- **Description**: Approves a driver account (sets status to 1).

### 3.10 Get My Trips (Driver)
- **Method**: `GET`
- **Path**: `/drivers/my-trips`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of trips assigned to the driver (legacy format).

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

### 4.5 Create Subscription Leave
- **Method**: `POST`
- **Path**: `/subscription/leave`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "from_date": "2026-03-01",
    "to_date": "2026-03-05",
    "reason": "Vacation"
  }
  ```

### 4.6 List My Leaves
- **Method**: `GET`
- **Path**: `/subscription/leaves`
- **Headers**: `Authorization: Bearer <token>`

### 4.7 Delete Leave
- **Method**: `DELETE`
- **Path**: `/subscription/leave/{leave_id}`
- **Headers**: `Authorization: Bearer <token>`

### 4.8 Change Pickup (Today Only)
- **Method**: `POST`
- **Path**: `/subscription/change-pickup-today`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{"pickup_stop_id": "uuid"}`
- **Rules**: Active subscription required; new stop must be on the same route; not allowed while on leave.

### 4.9 Get Today's Pickup
- **Method**: `GET`
- **Path**: `/subscription/pickup-today`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Returns current pickup stop for today; includes override indicator.
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
    "consumer_email": "optional@example.com",
    "payment_method": "BKASH"
  }
  ```
- **Response**: `PaymentRead` (payment is initiated and token is created on payment confirmation).
- **Note**: `direction` accepts `"UP"` or `"DOWN"`; the backend normalizes to `"TO_IUT"` / `"FROM_IUT"`.

### 5.2 Get My Tokens
- **Method**: `GET`
- **Path**: `/token/my-tokens`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of user's tokens.

### 5.3 Token History
- **Method**: `GET`
- **Path**: `/token/history`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `limit` (int, default: 50), `offset` (int, default: 0)
- **Response**: List of purchased tokens enriched with trip, route, vehicle, and driver info.

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

### 6.3 Get Route
- **Method**: `GET`
- **Path**: `/routes/{route_id}`

### 6.4 Update Route (TO)
- **Method**: `PATCH`
- **Path**: `/routes/{route_id}`
- **Request Body**: Partial route update.

### 6.5 Add Stop to Route (TO)
- **Method**: `POST`
- **Path**: `/routes/{route_id}/stops`
- **Request Body**: `{ "stop_name": "Banani", "sequence_number": 1 }`

### 6.6 Sync Route Stops (TO)
- **Method**: `PUT`
- **Path**: `/routes/{route_id}/stops`
- **Request Body**: List of stops to replace existing ones.

### 6.7 Get Stops (Alternative)
- **Method**: `GET`
- **Path**: `/stops/{route_id}/stops`
- **Response**: List of stops for a route.

---

## 7. Vehicles (`/vehicles`)

### 7.1 List Vehicles
- **Method**: `GET`
- **Path**: `/vehicles`

### 7.2 Get Vehicle
- **Method**: `GET`
- **Path**: `/vehicles/{vehicle_id}`

### 7.3 Create Vehicle (TO)
- **Method**: `POST`
- **Path**: `/vehicles`
- **Request Body**: `{"vehicle_number": "NR-01", "capacity": 40}`

### 7.4 Update Vehicle (TO)
- **Method**: `PATCH`
- **Path**: `/vehicles/{vehicle_id}`
- **Request Body**: `{"vehicle_number": "NR-01", "capacity": 40}`

### 7.5 Update Vehicle Status (TO)
- **Method**: `PATCH`
- **Path**: `/vehicles/{vehicle_id}/status`
- **Request Body**: `{"status": "IN_SERVICE"}`

### 7.6 Delete Vehicle (TO)
- **Method**: `DELETE`
- **Path**: `/vehicles/{vehicle_id}`

---

## 8. Trips (`/trips`)

### 8.1 Get Trip Availability
- **Method**: `GET`
- **Path**: `/trips/availability`
- **Response**: List of trips with seat counts. Includes `route_name`, `vehicle_number`, `driver_name`, `total_capacity`, `booked_seats`, and `available_seats`.

### 8.2 Get My Trips (Driver)
- **Method**: `GET`
- **Path**: `/trips/my`
- **Headers**: `Authorization: Bearer <token>`

### 8.3 Create Trip (TO)
- **Method**: `POST`
- **Path**: `/trips`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: TO schedules a one-off trip.

### 8.4 Start Trip (Driver)
- **Method**: `PATCH`
- **Path**: `/trips/{trip_id}/start`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated trip object with status `STARTED`.

### 8.5 Complete Trip (Driver)
- **Method**: `PATCH`
- **Path**: `/trips/{trip_id}/complete`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated trip object with status `COMPLETED`.
- **Rule**: All route stops must be marked arrived/departed before completion.

### 8.6 Get Trip Passengers (Driver)
- **Method**: `GET`
- **Path**: `/trips/{trip_id}/passengers`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of passengers (SeatAllocation and ACTIVE subscribers for the route/date). Driver-only for assigned trips.

### 8.7 Get Stop Progress (Driver)
- **Method**: `GET`
- **Path**: `/trips/{trip_id}/progress`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Per-stop arrival/departure timestamps for the trip.

### 8.8 Mark Stop Arrived (Driver)
- **Method**: `PATCH`
- **Path**: `/trips/{trip_id}/stops/{route_stop_id}/arrived`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated stop progress row. Requires trip `STARTED`. Enforces route sequence.

### 8.9 Mark Stop Departed (Driver)
- **Method**: `PATCH`
- **Path**: `/trips/{trip_id}/stops/{route_stop_id}/departed`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated stop progress row. Requires trip `STARTED` and previously marked arrived.

### 8.10 Get Live Tracking
- **Method**: `GET`
- **Path**: `/trips/tracking`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `trip_date` (date, default: today)
- **Response**: Live tracking snapshot for trips relevant to the user (token buyers and subscribers).

### 8.11 Tracking Stream
- **Method**: `GET`
- **Path**: `/trips/tracking/stream`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: NDJSON stream of tracking events (`started`, `arrived`, `departed`) for relevant trips.

---

## 9. Trip Templates (`/trip-templates`)

### 9.1 Create Trip Template (TO)
- **Method**: `POST`
- **Path**: `/trip-templates`
- **Roles**: TO required.
- **Request Body**: `TripTemplateCreate` schema.

### 9.2 List Trip Templates (TO)
- **Method**: `GET`
- **Path**: `/trip-templates`
- **Query**: `is_active` (bool), `route_id` (uuid)
- **Roles**: TO required.

### 9.3 Update Trip Template (TO)
- **Method**: `PUT`
- **Path**: `/trip-templates/{template_id}`
- **Roles**: TO required.

### 9.4 Delete Trip Template (TO)
- **Method**: `DELETE`
- **Path**: `/trip-templates/{template_id}`
- **Roles**: TO required.

---

## 10. Faculty Transport Requests (`/transport-requests`)

### 10.1 Create Request (Faculty)
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

### 10.2 Get My Requests (Faculty)
- **Method**: `GET`
- **Path**: `/transport-requests/my`

### 10.3 Get Request By ID (Faculty or TO)
- **Method**: `GET`
- **Path**: `/transport-requests/by-id/{request_id}`

### 10.4 List All Requests (TO)
- **Method**: `GET`
- **Path**: `/transport-requests`
- **Query**: `status_filter`

### 10.5 Update Status (TO)
- **Method**: `PATCH`
- **Path**: `/transport-requests/{id}/status`
- **Request Body**: `{"status": "APPROVED", "note": "..."}`

### 10.6 Assign Vehicle/Driver (TO)
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

### 10.7 List Vehicles (TO)
- **Method**: `GET`
- **Path**: `/transport-requests/vehicles`

### 10.8 List Drivers (TO)
- **Method**: `GET`
- **Path**: `/transport-requests/drivers`

---

## 11. Payments (`/payments`)

### 11.1 Initiate Payment
- **Method**: `POST`
- **Path**: `/payments/initiate`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "reference_type": "TOKEN",
    "reference_id": "reference-id",
    "payment_method": "BKASH",
    "amount": 50.0
  }
  ```

### 11.2 Confirm Payment
- **Method**: `POST`
- **Path**: `/payments/{payment_id}/confirm`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "external_txn_id": "gateway-id",
    "status": "SUCCESS"
  }
  ```

### 11.3 Get My Payments
- **Method**: `GET`
- **Path**: `/payments/me`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `status`, `payment_type`, `payment_method`, `start_date`, `end_date`

### 11.4 List Payments (TO)
- **Method**: `GET`
- **Path**: `/payments`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `user_id`, `status`, `payment_type`, `payment_method`, `start_date`, `end_date`, `min_amount`, `max_amount`, `offset`, `limit`

---

## 11. Notifications (`/notifications`)

### 11.1 Get Notifications
- **Method**: `GET`
- **Path**: `/notifications/`
- **Headers**: `Authorization: Bearer <token>`
- **Query**:
  - `skip` (int, default: 0)
  - `limit` (int, default: 20)
  - `unread_only` (bool, default: false)
- **Response**:
  ```json
  [
    {
      "id": "uuid",
      "title": "Subscription Approved",
      "message": "Your subscription...",
      "event_type": "SUBSCRIPTION_APPROVED",
      "reference_type": "SUBSCRIPTION",
      "reference_id": "uuid",
      "is_read": false,
      "created_at": "2024-03-01T10:00:00"
    }
  ]
  ```

### 11.2 Mark Notification as Read
- **Method**: `PATCH`
- **Path**: `/notifications/{id}/read`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Updated notification object.

### 11.3 Mark All as Read
- **Method**: `PATCH`
- **Path**: `/notifications/read-all`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "message": "All notifications marked as read",
    "count": 5
  }
  ```

### 11.4 Delete Notification
- **Method**: `DELETE`
- **Path**: `/notifications/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `204 No Content`

---

## 12. Analytics (`/analytics`)
- **All endpoints require Transport Officer role.**

### 12.1 Ridership Over Time
- **Method**: `GET`
- **Path**: `/analytics/ridership-over-time`
- **Query**: `days` (int, default: 14)
- **Response**: Daily points with `trips_count` and `seats_used`.

### 12.2 Ridership by Route
- **Method**: `GET`
- **Path**: `/analytics/ridership-by-route`
- **Query**: `days` (int, default: 30)
- **Response**: Per-route aggregates: `trips_count`, `passengers_total`.

### 12.3 Revenue Over Time
- **Method**: `GET`
- **Path**: `/analytics/revenue-over-time`
- **Query**: `days` (int, default: 14)
- **Response**: Daily totals: `total_amount`, `token_count`, `subscription_count`.

---

## Security Overview
- **Authentication**: JWT Bearer tokens.
- **User Types**: `STAFF`, `DRIVER`.
- **Roles**: `NORMAL_STAFF`, `FACULTY`, `TO` (Transport Officer).
- **Driver Auth**: Uses mobile number + password (mobile must be 11 digits starting with `01`).
- **Staff Auth**: Uses email + password (must be `@iut-dhaka.edu`).
