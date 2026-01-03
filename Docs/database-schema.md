# NexusRide Database Schema

This document describes the complete database schema for the NexusRide University Transport Management System. It reflects the current state of the backend `SQLModel` definitions.

---

## Overview of Tables

### Core Identity & Access
- **`user`**: Core identity (Staff, Driver, etc.).
- **`role`**: RBAC roles.
- **`userrole`**: Many-to-many link between users and roles.
- **`staff_profile`**: Extended attributes for staff members.
- **`driver_profile`**: Extended attributes for drivers.

### Transport Operations
- **`vehicle`**: Bus/Vehicle fleet information.
- **`route`**: Defined transport routes.
- **`route_stop`**: Stops associated with a route.
- **`trip`**: Scheduled or active trips for a specific date/time.

### Booking & Subscription
- **`subscription`**: Long-term travel subscriptions.
- **`subscription_leave`**: Paused periods for subscriptions.
- **`token`**: One-off travel tokens.
- **`seat_allocation`**: Seat reservations per trip (for both subscriptions and tokens).

### Financials & System
- **`payment`**: Payment transaction records.
- **`notification`**: System notifications for users.

---

## 1. Identity & Access Management

### `user`
**Source**: `app/models/user.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, default: `uuid4` |
| `email` | VARCHAR | Unique, Nullable |
| `password_hash` | VARCHAR | |
| `full_name` | VARCHAR | |
| `user_type` | VARCHAR | `STAFF` / `DRIVER` |
| `last_login` | TIMESTAMP | Nullable |

### `role`
**Source**: `app/models/role.py`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK, Auto-increment |
| `name` | VARCHAR | Unique (e.g., `ADMIN`, `FACULTY`) |

### `userrole`
**Source**: `app/models/role.py`
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID | PK, FK → `user.id` |
| `role_id` | INTEGER | PK, FK → `role.id` |

### `staff_profile`
**Source**: `app/models/profile.py`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | UUID | FK → `user.id` (Unique) |
| `staff_code` | VARCHAR | Unique |
| `department` | VARCHAR | |
| `default_route_id` | UUID | FK → `route.id`, Nullable |
| `default_pickup_stop_id` | UUID | FK → `route_stop.id`, Nullable |

### `driver_profile`
**Source**: `app/models/profile.py`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | UUID | FK → `user.id` (Unique) |
| `license_number` | VARCHAR | |
| `assigned_vehicle_id` | UUID | FK → `vehicle.id`, Nullable |

---

## 2. Subscriptions & Tokens

### `subscription`
**Source**: `app/models/subscription.py`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | UUID | FK → `user.id` |
| `status` | VARCHAR | `PENDING`, `ACTIVE`, `EXPIRED` |
| `start_date` | DATE | Nullable |
| `end_date` | DATE | Nullable |

### `subscription_leave`
**Source**: `app/models/subscription.py`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK |
| `subscription_id` | INTEGER | FK → `subscription.id` |
| `from_date` | DATE | |
| `to_date` | DATE | |
| `reason` | VARCHAR | Nullable |

### `token`
**Source**: `app/models/token.py`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | PK |
| `user_id` | UUID | FK → `user.id` |
| `route_id` | UUID | FK → `route.id` |
| `travel_date` | DATE | |
| `pickup_stop_id` | UUID | FK → `route_stop.id` |
| `status` | VARCHAR | `ACTIVE`, `CANCELLED`, `USED` |
| `created_at` | TIMESTAMP | Default: `now()` |

---

## 3. Transport Management

### `vehicle`
**Source**: `app/models/vehicle.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `vehicle_number` | VARCHAR | Unique |
| `capacity` | INTEGER | |
| `status` | VARCHAR | `AVAILABLE`, `IN_SERVICE`, `UNDER_REPAIR` |
| `created_at` | TIMESTAMP | |

### `route`
**Source**: `app/models/route.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `route_name` | VARCHAR | |
| `start_point` | VARCHAR | |
| `end_point` | VARCHAR | |
| `is_active` | BOOLEAN | Default: `True` |

### `route_stop`
**Source**: `app/models/route.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `route_id` | UUID | FK → `route.id` |
| `stop_name` | VARCHAR | |
| `sequence_number` | INTEGER | Order of stop in route |

### `trip`
**Source**: `app/models/trip.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `vehicle_id` | UUID | FK → `vehicle.id` |
| `driver_profile_id` | INTEGER | FK → `driver_profile.id` |
| `route_id` | UUID | FK → `route.id` |
| `trip_date` | DATE | |
| `start_time` | TIME | |
| `status` | VARCHAR | `SCHEDULED`, `STARTED`, `COMPLETED` |

### `seat_allocation`
**Source**: `app/models/seat_allocation.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `trip_id` | UUID | FK → `trip.id` |
| `user_id` | UUID | FK → `user.id` |
| `seat_type` | VARCHAR | `SUBSCRIPTION`, `TOKEN`, `GUEST` |
| `pickup_stop_id` | UUID | FK → `route_stop.id` |

---

## 4. Finance & System

### `payment`
**Source**: `app/models/payment.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `user.id` |
| `amount` | DECIMAL | |
| `payment_type` | VARCHAR | `SUBSCRIPTION`, `TOKEN` |
| `status` | VARCHAR | `SUCCESS`, `FAILED` |
| `transaction_time` | TIMESTAMP | |

### `notification`
**Source**: `app/models/notification.py`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `user.id` |
| `message` | VARCHAR | |
| `is_read` | BOOLEAN | Default: `False` |
| `created_at` | TIMESTAMP | |

---

## Relationship Summary

### Identity
- **User ↔ Role**: Many-to-Many (`userrole` table).
- **User ↔ StaffProfile**: One-to-One.
- **User ↔ DriverProfile**: One-to-One.

### Operations
- **Route ↔ RouteStop**: One-to-Many (One route has multiple stops).
- **Driver ↔ Vehicle**: One-to-Many (Driver can drive different vehicles, but `driver_profile` links to currently assigned vehicle).
- **Trip Relationships**: Links `Vehicle`, `Driver`, and `Route` for a specific instance.

### Booking
- **User ↔ Subscription**: One-to-Many.
- **Subscription ↔ SubscriptionLeave**: One-to-Many.
- **User ↔ Token**: One-to-Many.
- **Trip ↔ SeatAllocation**: One-to-Many (Tracks which user is on which trip).
