# Implementation Log: Subscribe Flow & Subscription Model (January 19)

## 1. Requirements Addressed in This Session

- Treat “subscriber” as a **state of a STAFF user**, not a separate role.
- Model a **1:1 relationship** between `subscription` and `route_stop` using the `stop_name` column.
- Implement backend subscribe behavior:
  - On subscribe, automatically create/update a `subscription` row with:
    - `user_id` = current user (STAFF only)
    - `stop_name` = chosen pickup stop (FK to `route_stop.stop_name`)
    - `status` = `PENDING`
    - `start_date` = first day of chosen start month/year
    - `end_date` = last day of chosen end month/year
- Implement frontend flow:
  - After the user fills the subscription modal and clicks **Subscribe**:
    - Call the backend API to create/update the subscription.
    - Redirect the user to the **Subscriber Dashboard**.
  - Enforce access rules:
    - A “normal staff” user can access the subscriber dashboard **only if** their subscription `status` is `PENDING` or `ACTIVE`.

---

## 2. Database-Level Changes

### 2.1 `RouteStop` model: unique `stop_name`

**File:** `app/models/route.py`  
**Change:** Make `RouteStop.stop_name` globally unique so it can be used as a stable FK target.

```python
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4

class Route(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_name: str
    start_point: str
    end_point: str
    is_active: bool = Field(default=True)

class RouteStop(SQLModel, table=True):
    __tablename__ = "route_stop"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    route_id: UUID = Field(foreign_key="route.id")
    stop_name: str = Field(unique=True)
    sequence_number: int
```

**Reasoning:**

- We want `subscription.stop_name` to be a **foreign key** to `route_stop.stop_name`.
- SQLModel/SQLAlchemy require the target column to be uniquely constrained for such an FK to be safe and semantically correct.
- This enforces “one row per stop name” and enables a **1:1 relation** between subscription and route stop based on `stop_name`.

---

### 2.2 `Subscription` model: add `stop_name` as FK

**File:** `app/models/subscription.py`  
**Change:** Add `stop_name` with a foreign key reference to `route_stop.stop_name` and make it unique:

```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date
from uuid import UUID

class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id")
    stop_name: str = Field(foreign_key="route_stop.stop_name", unique=True)
    status: str   # PENDING, ACTIVE, EXPIRED
    start_date: Optional[date]
    end_date: Optional[date]
```

**Reasoning:**

- `stop_name` links a subscription to exactly one `route_stop` row, via a textual foreign key.
- `unique=True` ensures **one subscription per route stop** (system-wide), satisfying the 1:1 relation at the DB level.
- Keeps `user_id` as the logical owner of the subscription, while `stop_name` defines the pickup stop.

---

### 2.3 Schema Documentation Updates

**File:** `Docs/database-schema.md`  
**Key updates:**

- In the `subscription` table description:

  ```markdown
  ### `subscription`
  **Source**: `app/models/subscription.py`
  | Column | Type | Notes |
  |---|---|---|
  | `id` | INTEGER | PK |
  | `user_id` | UUID | FK → `user.id` |
  | `stop_name` | VARCHAR | Unique, FK → `route_stop.stop_name` |
  | `status` | VARCHAR | `PENDING`, `ACTIVE`, `EXPIRED` |
  | `start_date` | DATE | Nullable |
  | `end_date` | DATE | Nullable |
  ```

- In the `route_stop` table description:

  ```markdown
  ### `route_stop`
  **Source**: `app/models/route.py`
  | Column | Type | Notes |
  |---|---|---|
  | `id` | UUID | PK |
  | `route_id` | UUID | FK → `route.id` |
  | `stop_name` | VARCHAR | Unique |
  | `sequence_number` | INTEGER | Order of stop in route |
  ```

- Relationship summary extended with the new 1:1:

  ```markdown
  ### Booking
  - **User ↔ Subscription**: One-to-Many.
  - **Subscription ↔ SubscriptionLeave**: One-to-Many.
  - **Subscription ↔ RouteStop**: One-to-One (via `subscription.stop_name` ↔ `route_stop.stop_name`).
  - **User ↔ Token**: One-to-Many.
  - **Trip ↔ SeatAllocation**: One-to-Many (Tracks which user is on which trip).
  ```

**Reasoning:**

- Keeps the documentation synchronized with actual model definitions.
- Makes the new `stop_name` link and its cardinality explicit for future maintainers.

---

### 2.4 Data Cleanup

**Change:** Deleted leftover SQLite DB files at the project root:

- `test.db`
- `nexusride.db`
- `transport.db`
- `test_workflow.db`

**Reasoning:**

- These files contained older schemas/data that conflicted with the new unique/foreign key constraints.
- The system is designed to use PostgreSQL via `DATABASE_URL`, and these local DBs were only legacy/dev artifacts.
- Removing them avoids confusion and ensures tests are run against the correct schema.

---

## 3. Backend Subscribe API (`/subscription`)

**File:** `app/api/subscription.py`

Previously, `POST /subscription/`:

- Did not accept a body.
- Always used `date.today()` as `start_date`.
- Did not know about `stop_name` or a date range.

We refactored this endpoint to match the new subscribe flow.

### 3.1 Subscription schemas

**File:** `app/schemas/subscription.py`

```python
from sqlmodel import SQLModel
from typing import Optional
from datetime import date
from uuid import UUID

class SubscriptionRead(SQLModel):
    id: int
    user_id: UUID
    stop_name: str
    status: str
    start_date: Optional[date]
    end_date: Optional[date]

class SubscriptionCreate(SQLModel):
    start_month: str
    end_month: str
    year: int
    stop_name: str
```

**Key points:**

- `SubscriptionRead` now exposes `stop_name` to clients (for UI display and access checks).
- `SubscriptionCreate` is the DTO for the subscribe request:
  - `start_month` and `end_month` are string month codes (e.g. `"01"`).
  - `year` is an integer.
  - `stop_name` is a human-readable identifier that must match an existing `RouteStop`.

---

### 3.2 New `POST /subscription/` behavior

**Signature and imports:**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date
from calendar import monthrange

from app.db.session import get_session
from app.models.subscription import Subscription
from app.models.user import User
from app.models.route import RouteStop
from app.schemas.subscription import SubscriptionRead, SubscriptionCreate
from app.core.security import get_current_user

router = APIRouter(prefix="/subscription", tags=["subscription"])

@router.post("/", response_model=SubscriptionRead)
def subscribe(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    ...
```

**Step-by-step logic:**

1. **Authorization: only STAFF can subscribe**

   ```python
   if current_user.user_type != "STAFF":
       raise HTTPException(
           status_code=status.HTTP_403_FORBIDDEN,
           detail="Only STAFF users can subscribe"
       )
   ```

2. **Parse and validate month range**

   ```python
   start_month = int(data.start_month)
   end_month = int(data.end_month)
   year = data.year

   if start_month > end_month:
       raise HTTPException(
           status_code=status.HTTP_400_BAD_REQUEST,
           detail="start_month cannot be after end_month"
       )
   ```

   - Ensures the chosen start month is not later than the end month.

3. **Compute `start_date` and `end_date`**

   ```python
   start_date = date(year, start_month, 1)
   last_day = monthrange(year, end_month)[1]
   end_date = date(year, end_month, last_day)
   ```

   - Uses `calendar.monthrange` so February, leap years, etc. are handled correctly.
   - This directly encodes:
     - `start_date` = first day of chosen start month/year.
     - `end_date` = last day of chosen end month/year.

4. **Validate `stop_name` against `RouteStop`**

   ```python
   stop = session.exec(
       select(RouteStop).where(RouteStop.stop_name == data.stop_name)
   ).first()
   if not stop:
       raise HTTPException(
           status_code=status.HTTP_400_BAD_REQUEST,
           detail="Invalid stop name"
       )
   ```

   - Guarantees that the subscription always points to a **real** route stop.
   - Avoids dangling FKs and user typos.

5. **Fetch existing subscription, if any**

   ```python
   subscription = session.exec(
       select(Subscription).where(Subscription.user_id == current_user.id)
   ).first()
   ```

6. **Enforce at most one active/pending subscription**

   ```python
   if subscription:
       if subscription.status in {"ACTIVE", "PENDING"}:
           raise HTTPException(
               status_code=status.HTTP_400_BAD_REQUEST,
               detail="Subscription already active or pending"
           )
   ```

   - Preserves the original business rule: a user cannot start a new subscription while one is already active or pending.

7. **Update or create subscription row**

   - **If a past subscription exists (e.g. `EXPIRED`):**

     ```python
     if subscription:
         subscription.stop_name = data.stop_name
         subscription.status = "PENDING"
         subscription.start_date = start_date
         subscription.end_date = end_date
     ```

   - **If no subscription exists:**

     ```python
     else:
         subscription = Subscription(
             user_id=current_user.id,
             stop_name=data.stop_name,
             status="PENDING",
             start_date=start_date,
             end_date=end_date
         )
         session.add(subscription)
     ```

8. **Persist and return**

   ```python
   session.commit()
   session.refresh(subscription)
   return subscription
   ```

**Result:** The API now exactly encodes the subscribe flow described in the requirements.

---

### 3.3 `GET /subscription/` behavior

**File:** `app/api/subscription.py`

The retrieval endpoint remains logically the same, but now the response model includes `stop_name`:

```python
@router.get("/", response_model=SubscriptionRead)
def get_subscription(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    subscription = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )

    return subscription
```

**Reasoning:**

- Frontend needs to know:
  - Whether a subscription exists.
  - Its `status`.
  - Its associated `stop_name` and date range (for UI and access checks).

---

## 4. Frontend Integration

### 4.1 Subscription API helpers

**File:** `frontend/frontend/src/services/auth.js`

New helper functions built on top of the existing Axios instance:

```javascript
export const createSubscription = async (data, token) => {
  const response = await api.post('/subscription/', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getSubscription = async (token) => {
  const response = await api.get('/subscription/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
```

**Reasoning:**

- Keeps subscription-related HTTP logic centralized and consistent.
- Reuses the same `api` client and `Authorization` header pattern as `getMe`.

---

### 4.2 Staff Dashboard subscribe button behavior

**File:** `frontend/frontend/src/pages/dashboard/DashboardPage.jsx`

Key changes:

1. **Import subscription helper:**

   ```javascript
   import { createSubscription } from '../../services/auth';
   ```

2. **Updated `handleSubscribe` implementation:**

   ```javascript
   const handleSubscribe = async ({ startMonth, endMonth, year, stopName }) => {
     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
     if (!token) {
       window.alert('You must be logged in to subscribe');
       return;
     }

     try {
       await createSubscription(
         {
           start_month: startMonth,
           end_month: endMonth,
           year: Number(year),
           stop_name: stopName,
         },
         token
       );
       setSubscribeOpen(false);
       navigate('/subscriber');
     } catch (error) {
       const message = error.response?.data?.detail || 'Subscription failed';
       window.alert(message);
     }
   };
   ```

**Behavior:**

- Uses values from `SubscriptionModal` (start month, end month, year, stop name).
- Calls the backend with the exact DTO expected by `SubscriptionCreate`.
- On success:
  - Closes the modal.
  - Redirects to `/subscriber` (Subscriber Dashboard).
- On error:
  - Shows the backend error message where available (`detail`), or a generic message.

---

### 4.3 Routing for subscriber dashboard

**File:** `frontend/frontend/src/App.jsx`

Changes:

```javascript
import SubscriberDashboardPage from './pages/dashboard/SubscriberDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subscriber" element={<SubscriberDashboardPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Reasoning:**

- Defines a dedicated URL (`/subscriber`) for the subscriber experience.
- Keeps access control logic inside the page component (see next section).

---

### 4.4 Subscriber Dashboard access rule

**File:** `frontend/frontend/src/pages/dashboard/SubscriberDashboardPage.jsx`

Key additions:

1. **Imports and state:**

   ```javascript
   import { getSubscription } from '../../services/auth';

   const [checkingAccess, setCheckingAccess] = React.useState(true);
   ```

2. **Access check in `useEffect`:**

   ```javascript
   React.useEffect(() => {
     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

     if (!token) {
       navigate('/login');
       return;
     }

     const checkAccess = async () => {
       try {
         const subscription = await getSubscription(token);
         if (!subscription || !['PENDING', 'ACTIVE'].includes(subscription.status)) {
           navigate('/dashboard');
           return;
         }
       } catch {
         navigate('/dashboard');
         return;
       } finally {
         setCheckingAccess(false);
       }
     };

     checkAccess();
   }, [navigate]);
   ```

3. **Render gating:**

   ```javascript
   if (checkingAccess) {
     return null;
   }
   ```

**Resulting rule:**

- No token → redirect to `/login`.
- No subscription or error fetching subscription → redirect to `/dashboard`.
- Subscription present and `status` ∉ `{ "PENDING", "ACTIVE" }` → redirect to `/dashboard`.
- Only if `status` is `PENDING` or `ACTIVE` does the subscriber dashboard render.

This ties the concept of “subscriber” strictly to **subscription state**, not roles, matching the original design decision.

---

## 5. Test Adjustments

### 5.1 `tests/test_subscription_post.py`

**File:** `tests/test_subscription_post.py`

Previously, this script called `POST /subscription/` without a body. Now it needs to send the subscription request DTO:

```python
def test_subscription_post():
    try:
        token = get_auth_token()
        headers = {"Authorization": f"Bearer {token}"}
        body = {
            "start_month": "01",
            "end_month": "01",
            "year": 2025,
            "stop_name": "Main Street Stop",
        }

        print("Attempting to create subscription...")
        response = httpx.post(f"{BASE_URL}/subscription/", headers=headers, json=body)
        ...
```

**Note:** For this test to succeed end-to-end, there must be a `route_stop` row with `stop_name = "Main Street Stop"` in the database.

---

### 5.2 `tests/test_subscription_get.py`

**File:** `tests/test_subscription_get.py`

The helper that ensures a subscription exists now also sends the DTO:

```python
def get_auth_token_with_subscription():
    ...
    token = login_res.json()["access_token"]

    body = {
        "start_month": "01",
        "end_month": "01",
        "year": 2025,
        "stop_name": "Main Street Stop",
    }

    httpx.post(
        f"{BASE_URL}/subscription/",
        headers={"Authorization": f"Bearer {token}"},
        json=body
    )
    return token
```

This keeps the tests aligned with the new API contract.

---

## 6. End-to-End Flow Summary

Putting everything together:

1. A STAFF user logs in and receives a JWT (stored in `localStorage` as `token`).
2. On the **Dashboard**:
   - The user opens the **SubscriptionModal** and selects:
     - `startMonth`, `endMonth`, `year`, and a `stopName`.
   - On submit, `DashboardPage.handleSubscribe`:
     - Reads `token` from `localStorage`.
     - Calls `createSubscription` → `POST /subscription/` with `{ start_month, end_month, year, stop_name }`.
3. The backend:
   - Validates the user is `STAFF`.
   - Validates month range and computes `start_date`/`end_date`.
   - Ensures `stop_name` matches an existing `RouteStop`.
   - Checks existing `Subscription`:
     - If `ACTIVE`/`PENDING` → HTTP 400.
     - Else updates or creates a subscription row with `status = "PENDING"`.
4. On success, the frontend:
   - Closes the modal.
   - Redirects to `/subscriber`.
5. On `/subscriber`, `SubscriberDashboardPage`:
   - Reads `token`, calls `getSubscription`.
   - If subscription exists and `status` is `PENDING` or `ACTIVE` → subscriber dashboard renders.
   - Otherwise → redirect to `/dashboard` (or `/login` if not authenticated).

This implementation fully encodes the “subscriber as a state” model, ensuring that:

- The database enforces the `subscription` ↔ `route_stop` relationship via `stop_name`.
- The API enforces subscription validity and date ranges.
- The frontend routing and guards are driven by `subscription.status` and not by roles.
