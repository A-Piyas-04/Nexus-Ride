# Database Schema Changes (Jan 27)

This document outlines the modifications made to the NexusRide database schema and models on January 27th. The primary focus was adding contact information (Mobile Number, Email) to User and Profile models to ensure consistency and accessibility.

## 1. User Model (`app/models/user.py`)

Added a mobile number field to the core identity model.

- **Added Field**: `mobile_number`
  - **Type**: `VARCHAR` (String)
  - **Constraints**: `Unique`, `Nullable` (Optional)
  - **Purpose**: To store the Bangladeshi mobile number for users (Staff/Drivers).

## 2. Staff Profile Model (`app/models/profile.py`)

Enhanced the profile to include direct references to contact info, functioning as foreign keys to the User table for data integrity.

- **Added Field**: `email`
  - **Type**: `VARCHAR`
  - **Constraint**: `Foreign Key` → `user.email`
- **Added Field**: `mobile_number`
  - **Type**: `VARCHAR`
  - **Constraint**: `Foreign Key` → `user.mobile_number`

## 3. Driver Profile Model (`app/models/profile.py`)

Similar to Staff Profile, ensuring drivers also have their contact details linked in their profile.

- **Added Field**: `email`
  - **Type**: `VARCHAR`
  - **Constraint**: `Foreign Key` → `user.email`
- **Added Field**: `mobile_number`
  - **Type**: `VARCHAR`
  - **Constraint**: `Foreign Key` → `user.mobile_number`

## 4. Token Model (`app/models/token.py`)

Added `consumer_email` to allow specifying an email for the token holder, defaulting to the user's email but mutable.

- **Added Field**: `consumer_email`
  - **Type**: `VARCHAR`
  - **Constraints**: `Nullable` (Optional)
  - **Purpose**: Contact email for the token consumer.

## 5. Seeds Update

- **`app/seeds/drivers.py`**: Updated to seed drivers using `mobile_number` as a lookup identifier (if available) and ensuring both `email` and `mobile_number` are populated in the `DriverProfile`.

## Summary of Impact

| Table | New Column | Type | Description |
|---|---|---|---|
| `user` | `mobile_number` | `VARCHAR` | Unique mobile number |
| `staff_profile` | `email` | `VARCHAR` | FK to `user.email` |
| `staff_profile` | `mobile_number` | `VARCHAR` | FK to `user.mobile_number` |
| `driver_profile` | `email` | `VARCHAR` | FK to `user.email` |
| `driver_profile` | `mobile_number` | `VARCHAR` | FK to `user.mobile_number` |
| `token` | `consumer_email` | `VARCHAR` | Token holder email |
