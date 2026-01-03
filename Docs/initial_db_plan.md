# NexusRide – Database Schema & Role Model

This document describes the finalized database tables and role composition rules for the NexusRide University Transport Management System.  
The schema is based on the currently implemented backend models and extended to support a FACULTY role using Role-Based Access Control (RBAC).

---

## 1. Roles

The system uses Role-Based Access Control (RBAC).  
Roles are stored in the `role` table and assigned to users via the `userrole` join table.

### Available Roles
- STAFF
- FACULTY
- DRIVER
- ADMIN

---

## 2. Persona Composition Rules

Personas are formed by combining roles.  
These rules are enforced at the application/service layer.

| Persona             | Assigned Roles        | Notes |
|---------------------|-----------------------|-------|
| Normal Staff        | STAFF                 | Basic staff user |
| Faculty             | STAFF, FACULTY        | Faculty is also staff |
| Transport Officer   | STAFF, ADMIN          | Not FACULTY |
| Driver              | DRIVER                | Operational role |

### Constraints
- A user with role `FACULTY` must also have role `STAFF`
- A user with role `ADMIN` must **not** have role `FACULTY`
- Authorization is determined by roles, not by `user_type`

---

## 3. Database Tables

---

### 3.1 user

Stores core identity and authentication information.

| Column         | Type        | Notes |
|---------------|-------------|------|
| id            | UUID        | Primary key |
| email         | VARCHAR     | Unique, nullable |
| password_hash| VARCHAR     | Encrypted password |
| full_name     | VARCHAR     | User display name |
| user_type     | VARCHAR     | Primary label (STAFF / DRIVER) |
| last_login    | TIMESTAMP   | Nullable |

---

### 3.2 role

Defines system roles.

| Column | Type    | Notes |
|------|---------|------|
| id   | INTEGER | Primary key |
| name | VARCHAR | Unique role name |

---

### 3.3 userrole

Join table for many-to-many user–role mapping.

| Column  | Type  | Notes |
|-------|-------|------|
| user_id | UUID | FK → user.id |
| role_id | INT  | FK → role.id |

**Composite Primary Key:** (`user_id`, `role_id`)

---

### 3.4 subscription

Tracks subscription lifecycle for users.

| Column      | Type      | Notes |
|------------|-----------|------|
| id         | INTEGER   | Primary key |
| user_id    | UUID      | FK → user.id |
| status     | VARCHAR   | PENDING / ACTIVE / EXPIRED |
| start_date | DATE      | Nullable |
| end_date   | DATE      | Nullable |

---

### 3.5 staff_profile

Stores staff-specific metadata.

| Column                   | Type    | Notes |
|-------------------------|---------|------|
| id                      | INTEGER | Primary key |
| user_id                 | UUID    | FK → user.id (unique) |
| staff_code              | VARCHAR | Unique |
| department              | VARCHAR | Department name |
| default_route_id        | UUID    | FK → route.id |
| default_pickup_stop_id  | UUID    | FK → route_stop.id |

---

### 3.6 driver_profile

Stores driver-specific metadata.

| Column               | Type    | Notes |
|---------------------|---------|------|
| id                  | INTEGER | Primary key |
| user_id             | UUID    | FK → user.id (unique) |
| license_number      | VARCHAR | Driving license |
| assigned_vehicle_id | UUID    | FK → vehicle.id |

---

### 3.7 vehicle

Represents transport vehicles.

| Column          | Type    | Notes |
|----------------|---------|------|
| id             | UUID    | Primary key |
| vehicle_number | VARCHAR | Unique |
| capacity       | INTEGER | Seating capacity |
| status         | VARCHAR | AVAILABLE / IN_SERVICE / UNDER_REPAIR |
| created_at     | TIMESTAMP | |

---

### 3.8 route

Defines transport routes.

| Column      | Type    | Notes |
|------------|---------|------|
| id         | UUID    | Primary key |
| route_name | VARCHAR | Route name |
| start_point| VARCHAR | Origin |
| end_point  | VARCHAR | Destination |
| is_active  | BOOLEAN | |

---

### 3.9 route_stop

Pickup stops under routes.

| Column          | Type    | Notes |
|----------------|---------|------|
| id             | UUID    | Primary key |
| route_id       | UUID    | FK → route.id |
| stop_name      | VARCHAR | Stop name |
| sequence_number| INTEGER | Order in route |

---

### 3.10 trip

Represents a scheduled or active trip.

| Column            | Type    | Notes |
|------------------|---------|------|
| id               | UUID    | Primary key |
| vehicle_id       | UUID    | FK → vehicle.id |
| driver_profile_id| INTEGER | FK → driver_profile.id |
| route_id         | UUID    | FK → route.id |
| trip_date        | DATE    | |
| start_time       | TIME    | |
| status           | VARCHAR | SCHEDULED / STARTED / COMPLETED |

---

### 3.11 seat_allocation

Allocates seats per trip.

| Column         | Type    | Notes |
|---------------|---------|------|
| id            | UUID    | Primary key |
| trip_id       | UUID    | FK → trip.id |
| user_id       | UUID    | FK → user.id |
| seat_type     | VARCHAR | SUBSCRIPTION / TOKEN / GUEST |
| pickup_stop_id| UUID    | FK → route_stop.id |

---

### 3.12 payment

Tracks payments.

| Column          | Type    | Notes |
|----------------|---------|------|
| id             | UUID    | Primary key |
| user_id        | UUID    | FK → user.id |
| amount         | DECIMAL | |
| payment_type   | VARCHAR | SUBSCRIPTION / TOKEN |
| status         | VARCHAR | SUCCESS / FAILED |
| transaction_time | TIMESTAMP | |

---

### 3.13 notification

Stores user notifications.

| Column      | Type    | Notes |
|------------|---------|------|
| id         | UUID    | Primary key |
| user_id    | UUID    | FK → user.id |
| message    | TEXT    | |
| is_read    | BOOLEAN | |
| created_at | TIMESTAMP | |

---

## 4. Summary

- RBAC enables flexible persona composition without schema changes
- Faculty is implemented as STAFF + FACULTY
- Transport Officer is STAFF + ADMIN (not FACULTY)
- All authorization decisions are role-driven
