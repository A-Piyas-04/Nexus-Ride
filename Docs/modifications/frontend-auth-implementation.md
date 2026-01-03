# Frontend Authentication Implementation & Backend Integration

This document details the implementation of the frontend authentication system (Signup/Login), its integration with the FastAPI backend, and specific fixes for error handling.

## 1. Overview

The frontend is built using **React (Vite)** and communicates with the **FastAPI** backend via REST APIs. The authentication flow includes:
- **Signup**: Creating a new staff account.
- **Login**: Authenticating with email/password to receive a JWT token.
- **Dashboard**: A protected route accessible only after login.
- **Logout**: Clearing the session.

## 2. Backend Connection

The connection between the frontend and backend is established using **Axios** for HTTP requests and **CORS** middleware on the server.

### 2.1 API Service Configuration
Located in `frontend/src/services/auth.js`, the Axios instance is configured to point to the local backend server.

```javascript
import axios from 'axios';

// Backend runs on port 8000
const API_URL = 'http://localhost:8000'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Endpoints
export const login = async (credentials) => api.post('/auth/login', credentials);
export const signup = async (data) => api.post('/auth/signup', data);
```

### 2.2 Server-Side CORS (Cross-Origin Resource Sharing)
To allow the React app (running on a different port, usually 5173) to talk to the FastAPI backend (port 8000), we enabled CORS in `app/main.py`.

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (dev mode)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)
```

### 2.3 Data Flow
1.  **User Action**: User submits the Login form.
2.  **Component**: `LoginPage.jsx` calls `login(email, password)` from `AuthContext`.
3.  **Context**: `AuthContext` calls the `login` function from `services/auth.js`.
4.  **Network**: Axios sends a `POST` request to `http://localhost:8000/auth/login`.
5.  **Backend Processing**:
    *   FastAPI receives the request.
    *   Verifies credentials against the PostgreSQL database.
    *   Returns a JSON response containing the `access_token`.
6.  **Response Handling**:
    *   Axios receives the response.
    *   `AuthContext` saves the token to `localStorage` and updates the `user` state.
    *   User is redirected to `/dashboard`.

## 3. Frontend Implementation Details

### 3.1 State Management (AuthContext)
We use React Context (`context/AuthContext.jsx`) to manage global authentication state.

*   **State Variables**: `user`, `loading`, `error`.
*   **Actions**: `login`, `signup`, `logout`, `clearError`.

### 3.2 Error Handling Fix ("Signup Failed" Persistence)
**Issue**: The error message (e.g., "Signup failed") would remain visible even after navigating to the Login page or refreshing the form.

**Fix**:
1.  **Added `clearError` to Context**:
    ```javascript
    const clearError = () => {
      setError(null);
    };
    ```
2.  **Reset on Mount**: Used `useEffect` in both `LoginPage.jsx` and `SignupPage.jsx` to clear errors when the component loads.
    ```javascript
    React.useEffect(() => {
      clearError();
    }, []);
    ```

### 3.3 Routing (`App.jsx`)
Routes are protected and organized using `react-router-dom`.

*   `/login` & `/signup`: Public routes (wrapped in `AuthLayout`).
*   `/dashboard`: Protected route (accessible after login).
*   `*`: Redirects unknown paths to `/login`.

## 4. Verification

*   **Backend Tests**: `tests/test_signup.py` and `tests/test_login.py` verified the API endpoints on port 8000.
*   **Frontend Tests**: Verified manually by successfully creating a user, logging in, and observing the redirection to the Dashboard.
