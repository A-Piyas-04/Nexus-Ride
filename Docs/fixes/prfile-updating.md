# Staff Profile Implementation & Debugging Log

This document details the issues encountered during the implementation of the Staff Profile feature and their respective solutions.

## 1. White Screen / Module Export Error

### **Location**
*   **File:** `frontend/src/pages/profiles/Staff_Profile.jsx`
*   **Context:** Application startup.

### **Error**
```
Uncaught SyntaxError: The requested module '/src/pages/profiles/Staff_Profile.jsx' does not provide an export named 'default'
```

### **Reason**
The `Staff_Profile.jsx` file existed but was completely empty (0 lines). The `App.jsx` file attempted to import a default export from it, causing the module resolution to fail and the application to crash with a white screen.

### **Solution**
Implemented the basic structure of the `Staff_Profile` component with a default export.

---

## 2. Linting Error: Empty Catch Block

### **Location**
*   **File:** `frontend/src/pages/dashboard/DriverDashboard.jsx`
*   **Context:** Running `npm run lint`.

### **Error**
```
51:15  error  Empty block statement  no-empty
```

### **Reason**
The code contained an empty `catch {}` block, which is flagged by the linter as a bad practice because it swallows errors silently.

### **Solution**
Updated the catch block to log the error:
```javascript
} catch (error) {
  console.error('Failed to check approval status:', error);
}
```

---

## 3. Module Resolution Error (Incorrect Import Path)

### **Location**
*   **File:** `frontend/src/pages/profiles/Staff_Profile.jsx`
*   **Context:** Compilation / Runtime.

### **Error**
```
[plugin:vite:import-analysis] Failed to resolve import "../../dashboard/DashboardLayout" from "src/pages/profiles/Staff_Profile.jsx". Does the file exist?
```

### **Reason**
The relative import path was incorrect. The file is located at `src/pages/profiles/`, so `../../dashboard` would point to `src/dashboard`, which does not exist. `DashboardLayout` is in `src/pages/dashboard`.

### **Solution**
Corrected the import path to reference the sibling directory:
```javascript
import DashboardLayout from '../dashboard/DashboardLayout';
```

---

## 4. CORS Policy Block

### **Location**
*   **File:** `app/main.py`
*   **Context:** Frontend making API requests.

### **Error**
```
Access to XMLHttpRequest at 'http://localhost:8000/staff/profile' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### **Reason**
The backend's CORS configuration explicitly listed allowed origins (e.g., ports 5173, 5174). However, the frontend instance was running on **port 5175** (likely due to other ports being busy), which was not in the allowlist.

### **Solution**
Updated `app/main.py` to include a wider range of development ports in `allow_origins`:
```python
allow_origins=[
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:5175", "http://127.0.0.1:5175", # Added
    # ...
]
```

---

## 5. 500 Internal Server Error (Foreign Key Constraint)

### **Location**
*   **File:** `app/api/staff.py`
*   **Context:** Submitting the Staff Profile update form (PUT `/staff/profile`).

### **Error**
```
500 Internal Server Error
```
(Caused by `IntegrityError` or Foreign Key violation in the database).

### **Reason**
The `StaffProfile` model has a `mobile_number` field that is a **Foreign Key** referencing `User.mobile_number`.
In the update logic:
1.  The code attempted to update `current_user.mobile_number`.
2.  Then it attempted to update `profile.mobile_number` (the FK).
3.  Because SQLAlchemy buffers operations until a commit/flush, the database tried to validate the `profile.mobile_number` FK against the *existing* `User` record before the `User` update was applied. Since the `User` hadn't been updated in the DB yet, the new mobile number didn't exist in the parent table, causing a constraint violation.

### **Solution**
1.  **Explicit Flush:** Added `session.flush()` immediately after updating the `User` model. This forces the database to apply the `User` update first.
2.  **Sequential Logic:** Ensured `profile.mobile_number` is set only *after* the `User` update is flushed.
3.  **Error Handling:** Wrapped the endpoint logic in a `try...except` block to catch exceptions and return structured HTTP errors instead of silent crashes.

**Code Fix Snippet:**
```python
# Update User first
current_user.mobile_number = mobile_val
session.add(current_user)
session.flush() # CRITICAL: Update User table so FK is valid

# Now update Profile
profile.mobile_number = mobile_val
```
