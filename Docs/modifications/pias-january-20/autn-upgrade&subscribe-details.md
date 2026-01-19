# Auth Upgrade & Subscription Details Updates (January 20)

## 1) Email Domain Constraint (@iut-dhaka.edu)

### 1.1 Backend validation
- Enforced `@iut-dhaka.edu` domain validation at the schema level for both signup and login.
- Normalizes emails (trim + lowercase) before storing and querying.

**Files**
- [auth.py](file:///d:/Projects/Academic/Nexus-Ride/app/schemas/auth.py)
- [auth.py](file:///d:/Projects/Academic/Nexus-Ride/app/api/auth.py)

**Behavior**
- Requests to `POST /auth/signup` and `POST /auth/login` reject any email outside the university domain.
- Error response comes from schema validation, keeping API behavior consistent.

### 1.2 Frontend validation and UX
- Frontend blocks non-university emails before API calls.
- Error message is generic and does not reveal the required format.
- Error is shown inline and via popup.

**Files**
- [AuthContext.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/context/AuthContext.jsx)
- [SignupPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/SignupPage.jsx)
- [LoginPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/LoginPage.jsx)

**Behavior**
- Signup/Login rejects non-university emails with message: “Please use a valid university email address.”
- UI hints show that a university email is required (without exposing the exact domain in error text).

### 1.3 Test alignment
- Updated auth and subscription tests to use `@iut-dhaka.edu` emails.

**Files**
- [test_signup.py](file:///d:/Projects/Academic/Nexus-Ride/tests/test_signup.py)
- [test_login.py](file:///d:/Projects/Academic/Nexus-Ride/tests/test_login.py)
- [test_subscription_post.py](file:///d:/Projects/Academic/Nexus-Ride/tests/test_subscription_post.py)
- [test_subscription_get.py](file:///d:/Projects/Academic/Nexus-Ride/tests/test_subscription_get.py)

---

## 2) Subscription Details Functionality

### 2.1 Backend response includes route name
- Subscription API now includes the route name resolved from the stop’s route.

**Files**
- [subscription.py](file:///d:/Projects/Academic/Nexus-Ride/app/api/subscription.py)
- [subscription.py](file:///d:/Projects/Academic/Nexus-Ride/app/schemas/subscription.py)

**Behavior**
- `GET /subscription/` and `POST /subscription/` return:
  - `stop_name`
  - `route_name`
  - `status`, `start_date`, `end_date`

### 2.2 New subscription details modal
- Added a dedicated modal to display subscription data.
- The “Subscription details” button now opens the modal and shows live data fetched from the API.

**Files**
- [SubscriptionDetailsModal.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/modals/SubscriptionDetailsModal.jsx)
- [SubscriberDashboardPage.jsx](file:///d:/Projects/Academic/Nexus-Ride/frontend/frontend/src/pages/dashboard/SubscriberDashboardPage.jsx)

**Behavior**
- Modal shows status, route, stop, start date, and end date for the current user.
- Loading state is shown while the details are fetched.

---

## 3) Verification

- Frontend lint: `npm run lint`
- Backend syntax: `python -m compileall app`
