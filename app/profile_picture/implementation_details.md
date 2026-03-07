# Profile Picture Implementation Details

This document outlines the implementation details of the Profile Picture feature in the NexusRide backend.

## Overview

The profile picture feature allows Staff and Drivers to upload, store, and retrieve their profile pictures. Images are stored directly in the database as binary data (`BYTEA` in PostgreSQL / `BLOB` in SQLite) to avoid external file storage dependencies and keep the application self-contained.

## Folder Structure Changes

The feature logic is encapsulated in a dedicated module `app/profile_picture/` (moved from `app/services/profile_picture/`).

### Files Created

1.  **`app/profile_picture/router.py`**
    *   **Purpose**: Defines the API endpoints for uploading and fetching profile pictures.
    *   **Endpoints**:
        *   `POST /profile/picture`: Uploads a profile picture for the authenticated user.
        *   `GET /profile/picture/{user_id}`: Retrieves the profile picture for a specific user.
    *   **Dependencies**: Uses `app.core.security.get_current_user` for authentication and `app.db.session.get_session` for database access.

2.  **`app/profile_picture/service.py`**
    *   **Purpose**: Handles the business logic for database interactions.
    *   **Functions**:
        *   `get_profile_by_user_id(session, user_id)`: Helper to find the correct profile (Staff or Driver) based on the User ID.
        *   `save_profile_picture(session, user_id, image_bytes, mime_type, filename)`: Updates the profile record with the image data.
        *   `get_profile_picture(session, user_id)`: Retrieves the image binary and MIME type.

3.  **`app/profile_picture/utils.py`**
    *   **Purpose**: Provides utility functions for image processing and validation.
    *   **Key Logic**:
        *   Validates file size (Max 2MB).
        *   Validates MIME types (`image/jpeg`, `image/png`, `image/webp`).
        *   Verifies image integrity using `Pillow`.

## Database Schema Modifications

### `app/models/profile.py`

The `StaffProfile` and `DriverProfile` models were updated to include the following columns:

*   **`profile_picture`**: `LargeBinary` (Mapped to `BLOB`/`BYTEA`) - Stores the raw image data.
*   **`profile_picture_mime`**: `String` - Stores the MIME type (e.g., `image/png`).
*   **`profile_picture_filename`**: `String` - Stores the original filename.
*   **`has_profile_picture`**: `@property` - A boolean property to easily check if a user has a profile picture without loading the binary data.

### `app/schemas/profile.py`

*   **`StaffProfileRead`** and **`DriverProfileRead`**: Added `has_profile_picture: bool` field to the response schema.

## API Integration

### `app/main.py`
*   Registered the new router: `app.include_router(profile_picture_router)`.

### `app/api/staff.py` & `app/api/drivers.py`
*   Updated the profile retrieval endpoints to include the `has_profile_picture` field in the response.

## Dependencies Added

*   **`Pillow`**: Python Imaging Library, used for validating image file integrity and format.
