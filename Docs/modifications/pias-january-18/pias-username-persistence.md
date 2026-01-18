# Username Persistence Fix (Dashboard refresh issue)

## 1) Problem (What you saw)

After a successful login, the Dashboard correctly showed:

- `Welcome, johnp`
- `Logged in as johnp@NIUT.edu`

But after refreshing the page, the same Dashboard rendered as:

- `Welcome, User`
- `Logged in as` (blank)

So the UI “lost” the username/email persistence on a hard refresh.

---

## 2) Root Cause (Why it happened)

### 2.1 Frontend auth state was not persisted

In the frontend, authentication state is held in React Context state (`user`), inside:

- [AuthContext.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/context/AuthContext.jsx)

React state resets on full page refresh, so `user` becomes `null` again.

### 2.2 Token was stored, but user profile was not re-hydrated

The login flow stored the JWT token:

```js
localStorage.setItem('token', data.access_token);
setUser({ email });
```

But on refresh, the app never:

- reads the token from `localStorage`,
- validates it,
- fetches `/auth/me`,
- and restores `user` back into the context.

### 2.3 Dashboard depended on context user data

Dashboard reads `user?.email` and uses it to compute the welcome name:

- [DashboardPage.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/DashboardPage.jsx)

When `user` is `null`, it falls back to `"User"`, causing the refreshed screen.

---

## 3) Fix Overview (What we changed)

We implemented proper “session hydration”:

1. Added a backend endpoint `GET /auth/me` that returns the currently authenticated user.
2. Added a frontend API call `getMe(token)` to call `/auth/me`.
3. Updated `AuthProvider` to:
   - load token from `localStorage` on page load,
   - optionally show cached user fields immediately (fast UI),
   - then fetch `/auth/me` to populate the real user object in context,
   - clear token/user cache if the token is invalid/expired.
4. Updated Dashboard/Login/Signup pages to use the hook from a dedicated context file (to satisfy the ESLint react-refresh rule).

---

## 4) Backend Changes

### 4.1 Modified file

- Modified: [auth.py](file:///e:/Projects/NexusRide/app/api/auth.py)

### 4.2 Added endpoint: `GET /auth/me`

This endpoint uses the existing `get_current_user` dependency (JWT verification + user lookup):

```py
from app.core.security import create_access_token, get_current_user

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "user_type": current_user.user_type,
    }
```

Result: the frontend can restore user identity from a persisted token after refresh.

---

## 5) Frontend Changes

### 5.1 Modified file: add `/auth/me` API call

- Modified: [auth.js](file:///e:/Projects/NexusRide/frontend/frontend/src/services/auth.js)

Added:

```js
export const getMe = async (token) => {
  const response = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
```

### 5.2 New file: split AuthContext exports (ESLint react-refresh)

ESLint rule `react-refresh/only-export-components` requires that a file exporting React components should not also export non-component values.

To comply, we created:

- Added: [auth-context.js](file:///e:/Projects/NexusRide/frontend/frontend/src/context/auth-context.js)

```js
import React from 'react';

export const AuthContext = React.createContext(null);

export const useAuth = () => React.useContext(AuthContext);
```

### 5.3 Modified file: hydrate user on app load

- Modified: [AuthContext.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/context/AuthContext.jsx)

Key additions:

#### (A) On mount, load token and hydrate the user

```js
useEffect(() => {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');
  if (!token) return;

  const cachedEmail = localStorage.getItem('user_email');
  const cachedFullName = localStorage.getItem('full_name');

  if (cachedEmail || cachedFullName) {
    setUser({
      email: cachedEmail || undefined,
      full_name: cachedFullName || undefined,
    });
  }

  const hydrateUser = async () => {
    setLoading(true);
    try {
      const me = await getMeApi(token);
      setUser(me);

      if (me?.email) localStorage.setItem('user_email', me.email);
      if (me?.full_name) localStorage.setItem('full_name', me.full_name);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('full_name');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  hydrateUser();
}, []);
```

#### (B) On login, store token + email and then fetch profile

```js
const data = await loginApi({ email, password });
localStorage.setItem('token', data.access_token);
localStorage.setItem('user_email', email);
setUser({ email });

try {
  const me = await getMeApi(data.access_token);
  setUser(me);

  if (me?.email) localStorage.setItem('user_email', me.email);
  if (me?.full_name) localStorage.setItem('full_name', me.full_name);
} catch {
  localStorage.removeItem('full_name');
}
```

#### (C) On logout, clear persisted session

```js
localStorage.removeItem('token');
localStorage.removeItem('user_email');
localStorage.removeItem('full_name');
setUser(null);
```

### 5.4 Modified files: update imports + fix lint warnings

We updated pages to use `useAuth` from the new file and fixed hook dependency warnings and unused catch variables:

- Modified: [LoginPage.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/LoginPage.jsx)
- Modified: [SignupPage.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/SignupPage.jsx)
- Modified: [DashboardPage.jsx](file:///e:/Projects/NexusRide/frontend/frontend/src/pages/DashboardPage.jsx)

Example (Login useEffect dependency fix):

```js
React.useEffect(() => {
  clearError();
}, [clearError]);
```

---

## 6) Verification (What we ran)

### 6.1 Frontend lint

Ran (and passed):

- `npm run lint`

### 6.2 Backend syntax validation

Ran (and passed):

- `python -m compileall app`

---

## 7) Expected Behavior After Fix

- After login: Dashboard shows correct username/email.
- After refresh: Dashboard continues to show the same username/email.
- If token is invalid/expired: the app clears the token and user cache, and the UI behaves as logged out.
