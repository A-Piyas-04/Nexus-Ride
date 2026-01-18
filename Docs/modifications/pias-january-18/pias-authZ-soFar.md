# Authorization (AuthZ) – Current State and Plan (2026-01-18)

This document summarizes the current Authorization implementation in the NexusRide backend and outlines the near-term AuthZ plan, based on the project’s codebase and the decisions made in chat.

Scope: Backend (`e:\Projects\NexusRide\app`)

---

## 1) Glossary: AuthN vs AuthZ

### Authentication (AuthN)
Proves “who you are”.
- Implemented using JWT bearer tokens.
- User logs in, receives a token, and sends it in `Authorization: Bearer <token>`.

### Authorization (AuthZ)
Decides “what you can do”.
- For NexusRide, AuthZ is based on:
  - `user_type` (coarse type: STAFF vs DRIVER)
  - `role` assignment (fine-grained within STAFF: NORMAL_STAFF, FACULTY, TO)

---

## 2) Domain Rules (Current Decision)

### User Types
There will be 2 user types:
1. Staff
2. Driver

In the current codebase, this is represented by:
- `user.user_type` in [user.py](file:///e:/Projects/NexusRide/app/models/user.py)
  - Expected values: `STAFF` / `DRIVER`

### Staff Roles
Staff users can have 3 roles:
1. NORMAL_STAFF
2. FACULTY
3. TO (Transport Officer)

In the current codebase, this is represented by:
- `role.name` in [role.py](file:///e:/Projects/NexusRide/app/models/role.py)

### Initial Project Behavior (Default Assignment)
For the initial state of the project:
- On successful signup, everyone is:
  - `user_type = STAFF`
  - assigned role `NORMAL_STAFF`

---

## 3) Authorization Data Model (Tables)

This project already had RBAC tables defined; the AuthZ plan uses them directly.

### `user`
Source: [user.py](file:///e:/Projects/NexusRide/app/models/user.py)

Key fields:
- `id` (UUID): Primary key
- `email` (unique): login identifier
- `user_type`: `STAFF` / `DRIVER`

### `role`
Source: [role.py](file:///e:/Projects/NexusRide/app/models/role.py)

Key fields:
- `id` (int): Primary key
- `name` (unique): role identifier (e.g., `NORMAL_STAFF`, `FACULTY`, `TO`)

### `userrole`
Source: [role.py](file:///e:/Projects/NexusRide/app/models/role.py)

Purpose:
- Many-to-many mapping between `user` and `role`

Key fields:
- `user_id` (UUID): FK → `user.id`
- `role_id` (int): FK → `role.id`

---

## 4) What Authorization Was Already Implemented (Before This Chat)

### AuthN (JWT-based login protection)
Implemented in [security.py](file:///e:/Projects/NexusRide/app/core/security.py):
- `create_access_token(...)`: issues JWT with `sub=<user_id>` and expiry
- `get_current_user(...)`: validates JWT and loads `User` from DB

Effect:
- Any API route that includes `current_user: User = Depends(get_current_user)` is authenticated (requires a valid token).

### Basic “type check” style AuthZ (not RBAC)
Implemented in [subscription.py](file:///e:/Projects/NexusRide/app/api/subscription.py):
- `POST /subscription/` checks:
  - `current_user.user_type == "STAFF"`
  - otherwise returns 403

What this means:
- The backend had a minimal authorization rule based on `user_type`.
- The RBAC tables existed but were not used for endpoint authorization.

---

## 5) What We Implemented Now (Based on This Chat)

Two practical steps were added to make AuthZ work without manual DB operations and without overcomplicating:

### (A) Role Seeding on Startup (ensure roles exist)
Implemented in [main.py](file:///e:/Projects/NexusRide/app/main.py#L26-L38).

Behavior:
- On app startup (during lifespan):
  - create tables (`SQLModel.metadata.create_all(engine)`)
  - seed roles: `NORMAL_STAFF`, `FACULTY`, `TO`
    - for each role name:
      - if it does not exist → insert it

Why it matters:
- Signup can safely assign the default role without depending on a human to insert rows into `role`.
- This seeding is idempotent: re-running startup does not create duplicates because `Role.name` is unique.

### (B) Default Staff Role Assignment on Signup
Implemented in [auth.py](file:///e:/Projects/NexusRide/app/api/auth.py#L13-L39).

Behavior:
- `POST /auth/signup` now:
  - normalizes email
  - rejects duplicate emails with a 400
  - creates the user with `user_type="STAFF"`
  - ensures `NORMAL_STAFF` role exists (fallback safety)
  - inserts `UserRole(user_id=<new_user>, role_id=<NORMAL_STAFF>)`

Result:
- Every newly registered user becomes a STAFF user with role NORMAL_STAFF automatically.

---

## 6) Current State of AuthZ (As of Now)

### What works today
- Authentication exists and is used by protected routes:
  - JWT login and `get_current_user` enforcement ([security.py](file:///e:/Projects/NexusRide/app/core/security.py))
- Staff/Driver coarse restriction exists in at least one place:
  - subscription requires `user_type == STAFF` ([subscription.py](file:///e:/Projects/NexusRide/app/api/subscription.py))
- RBAC data is now consistently present:
  - roles are seeded at startup ([main.py](file:///e:/Projects/NexusRide/app/main.py))
  - signup assigns `NORMAL_STAFF` ([auth.py](file:///e:/Projects/NexusRide/app/api/auth.py))

### What is not yet implemented
- Endpoint-level RBAC enforcement (e.g., “TO only” endpoints).
- A reusable authorization dependency like `require_roles("TO")`.
- Any admin/TO workflow to grant or change roles.
- Driver signup / driver role assignment flow (only STAFF signup exists right now).

---

## 7) AuthZ Plan (Next Steps, Still Simple)

This plan keeps things industry-aligned without adding complex permission frameworks yet.

### Step 1: Add a reusable role-check dependency
Add a small helper in [security.py](file:///e:/Projects/NexusRide/app/core/security.py) (or a new `app/core/authorization.py` if you later want separation) that:
- loads current user (via `get_current_user`)
- queries `role` via `userrole`
- allows access if user has one of the allowed roles

Example usage pattern (not implemented yet):
- `Depends(require_roles("TO"))` for Transport Officer endpoints
- `Depends(require_roles("FACULTY", "TO"))` for shared access endpoints

### Step 2: Decide which endpoints are role-protected
Keep current `user_type` checks for coarse domain separation, and add RBAC only where it matters:
- Transport management endpoints (routes, vehicles, trips scheduling) → typically `TO`
- Normal staff endpoints (view availability, subscribe, token purchase) → `NORMAL_STAFF` / `FACULTY` / `TO`

### Step 3: Add controlled role management
- Add an endpoint that can promote/demote staff roles.
- Restrict it to `TO` (or to a future `ADMIN` role).

Minimal approach:
- “TO-only” endpoint that updates `userrole` for a given user.

### Step 4: Tighten production security later (AuthN hardening)
- Move `SECRET_KEY` and `ALGORITHM` to environment variables (currently `SECRET_KEY` is hardcoded in [security.py](file:///e:/Projects/NexusRide/app/core/security.py#L10-L12)).
- Return `token_type: "bearer"` in login responses for standard client behavior.
- Replace `create_all` with migrations once schema stabilizes (Alembic).

---

## 8) Quick Trace: How AuthZ Works End-to-End (Today)

1. `POST /auth/signup`:
   - Creates `user` (user_type=STAFF)
   - Creates `userrole` linking user to role `NORMAL_STAFF`
   - Source: [auth.py](file:///e:/Projects/NexusRide/app/api/auth.py)

2. `POST /auth/login`:
   - Validates password, issues JWT
   - Source: [auth.py](file:///e:/Projects/NexusRide/app/api/auth.py)

3. Any protected endpoint:
   - Reads token via OAuth2 bearer
   - Loads `current_user` using `get_current_user`
   - Source: [security.py](file:///e:/Projects/NexusRide/app/core/security.py)

4. Subscription endpoint:
   - Enforces `current_user.user_type == STAFF`
   - Source: [subscription.py](file:///e:/Projects/NexusRide/app/api/subscription.py)

Note:
- Role-based enforcement (NORMAL_STAFF/FACULTY/TO) is not yet used in endpoints; only the data is prepared.
