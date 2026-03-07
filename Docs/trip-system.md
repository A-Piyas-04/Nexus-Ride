# Trip System Documentation

This document describes the trip system end-to-end, including models, schemas, API routes, role interactions, and system flow.

---

## 1. Overview

Trips represent scheduled vehicle movements for a specific route, date, time, and direction. Trips are created either:
- Automatically from trip templates (daily scheduler), or
- Manually by a Transport Officer (TO).

Trips are used to:
- Show availability to staff users,
- Allocate seats to token buyers,
- Reserve seats for active subscriptions,
- Drive driver workflows (start/complete trips).

---

## 2. Core Models

### 2.1 Trip
**Source**: [trip.py](file:///e:/Projects/NexusRide/app/models/trip.py)
- **Key Fields**:
  - `route_id`, `vehicle_id`, `driver_profile_id`
  - `trip_date`, `start_time`, `direction`
  - `status` (`SCHEDULED`, `STARTED`, `COMPLETED`)
- **Uniqueness**:
  - `(route_id, trip_date, start_time, direction)` is unique.

### 2.2 TripTemplate
**Source**: [trip_template.py](file:///e:/Projects/NexusRide/app/models/trip_template.py)
- Defines recurring trips.
- Fields: `route_id`, `vehicle_id`, `driver_profile_id`, `direction`, `start_time`, `is_active`, `valid_from`, `valid_to`.

### 2.3 ScheduleOverride
**Source**: [schedule_override.py](file:///e:/Projects/NexusRide/app/models/schedule_override.py)
- Date-specific adjustments to trip generation.
- Fields: `route_id`, `date`, `new_start_time`, `is_cancelled`.

### 2.4 SeatAllocation
**Source**: [seat_allocation.py](file:///e:/Projects/NexusRide/app/models/seat_allocation.py)
- Represents a reserved seat for a user on a trip.
- Fields: `trip_id`, `user_id`, `seat_type` (`SUBSCRIPTION`, `TOKEN`, `GUEST`), `pickup_stop_id`.

### 2.5 Related Models
- **Route / RouteStop**: [route.py](file:///e:/Projects/NexusRide/app/models/route.py)
- **Vehicle**: [vehicle.py](file:///e:/Projects/NexusRide/app/models/vehicle.py)
- **DriverProfile**: [profile.py](file:///e:/Projects/NexusRide/app/models/profile.py)
- **Subscription / SubscriptionLeave**: [subscription.py](file:///e:/Projects/NexusRide/app/models/subscription.py)
- **Token**: [token.py](file:///e:/Projects/NexusRide/app/models/token.py)
- **Payment**: [payment.py](file:///e:/Projects/NexusRide/app/models/payment.py)

---

## 3. Schemas (DTOs)

### 3.1 Trip Schemas
**Source**: [trip.py](file:///e:/Projects/NexusRide/app/schemas/trip.py)
- `TripCreate`, `TripRead`
- `TripAvailabilityRead` (adds `route_name`, `vehicle_number`, `driver_name`, `capacity` and seat counts)
- `TripForDriverRead` (driver-specific list)

### 3.2 Trip Template Schemas
**Source**: [trip_template.py](file:///e:/Projects/NexusRide/app/schemas/trip_template.py)
- `TripTemplateCreate`, `TripTemplateRead`, `TripTemplateUpdate`

### 3.3 Seat Allocation Schemas
**Source**: [seat_allocation.py](file:///e:/Projects/NexusRide/app/schemas/seat_allocation.py)
- `SeatAllocationCreate`, `SeatAllocationRead`

---

## 4. Trip Lifecycle & State Transitions

**States**:
- `SCHEDULED` → `STARTED` → `COMPLETED`

**Transitions** (enforced in [trips.py](file:///e:/Projects/NexusRide/app/api/trips.py)):
- Only the assigned driver can start a trip.
- Only the assigned driver can complete a started trip.

---

## 5. Trip Generation & Scheduling

### 5.1 Automatic Generation
**Service**: [trip_generator.py](file:///e:/Projects/NexusRide/app/services/trip_generator.py)
- Loads all active `TripTemplate` rows.
- Applies `ScheduleOverride` (cancel or override start time).
- Avoids duplicates using unique constraint.
- Creates `Trip` rows with status `SCHEDULED`.

### 5.2 Scheduler
**Service**: [scheduler.py](file:///e:/Projects/NexusRide/app/services/scheduler.py)
- Runs daily at **00:05**.
- Generates trips for the current date.

### 5.3 Manual Scheduling
**API**: `POST /trips`
- Transport Officer only.
- Creates a single `Trip` with status `SCHEDULED` for the provided date/time.

---

## 6. Seat Availability & Reservation Logic

### 6.1 Availability Calculation
**API**: `GET /trips/availability`
- Joins `Trip`, `Route`, `Vehicle`, `DriverProfile`, `User`.
- Computes **booked seats** as:
  - `SeatAllocation` count (token seats)
  - plus subscription-reserved seats via [subscription_reserved.py](file:///e:/Projects/NexusRide/app/services/subscription_reserved.py)
- Computes `available_seats = vehicle.capacity - booked_seats`.

### 6.2 Subscription Reserved Seats
**Service**: [subscription_reserved.py](file:///e:/Projects/NexusRide/app/services/subscription_reserved.py)
- Counts ACTIVE subscriptions mapped to the trip’s route.
- Excludes users on `SubscriptionLeave` for the target date.

### 6.3 Token Seats
- Token purchase begins with `POST /token/buy` (creates a Payment).
- Token seat is allocated only after `POST /payments/{payment_id}/confirm` succeeds.
- Allocation occurs in [payment.py](file:///e:/Projects/NexusRide/app/api/payment.py) → `create_token_from_payment`.

---

## 7. Trip APIs (Backend)

### 7.1 Trip Availability
- `GET /trips/availability`

### 7.2 Driver Trips
- `GET /trips/my` (preferred)
- `GET /drivers/my-trips` (legacy format)

### 7.3 Trip Lifecycle
- `POST /trips` (TO schedules one-off trip)
- `PATCH /trips/{trip_id}/start` (driver starts)
- `PATCH /trips/{trip_id}/complete` (driver completes)

### 7.4 Trip Templates
- `POST /trip-templates`
- `GET /trip-templates`
- `PUT /trip-templates/{template_id}`
- `DELETE /trip-templates/{template_id}`

---

## 8. Role Interaction Matrix

### 8.1 Staff (Normal Staff / Faculty)
- View availability (`/trips/availability`).
- Purchase tokens (`/token/buy` → `/payments/{id}/confirm`).
- Maintain subscriptions (`/subscription/`, `/subscription/leave`).

### 8.2 Driver
- View assigned trips (`/trips/my`).
- Start and complete assigned trips.

### 8.3 Transport Officer (TO)
- Manually schedule trips (`/trips`).
- Manage trip templates (`/trip-templates`).
- Manage vehicles, routes, and driver approvals.

### 8.4 Faculty Requests (Guest Transport)
- Requests are managed via `/transport-requests`.
- Assignment uses vehicles and drivers but does not create trips automatically.

---

## 9. End-to-End Trip Flow

1. **Template Creation**: TO creates recurring templates (`/trip-templates`).
2. **Daily Generation**: Scheduler generates trips at 00:05 using templates and overrides.
3. **Availability Check**: Staff queries `/trips/availability`.
4. **Token Purchase**: Staff buys token (`/token/buy`) → payment initiated.
5. **Payment Confirmation**: Payment confirmed (`/payments/{id}/confirm`) → token + seat allocation created.
6. **Driver Execution**: Driver starts and completes trip (`/trips/{id}/start`, `/trips/{id}/complete`).
7. **Subscription Impact**: Active subscriptions reserve seats and reduce availability unless on leave.
