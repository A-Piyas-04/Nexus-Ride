# Implementation Log: Route Model & Default Data (January 19)

## 1. Route model changes

**File:** `app/models/route.py`  

The `Route` table was simplified to remove the explicit start and end points.  
Previously:

- `id` (UUID, PK)
- `route_name` (VARCHAR)
- `start_point` (VARCHAR)
- `end_point` (VARCHAR)
- `is_active` (BOOLEAN)

Now:

- `id` (UUID, PK)
- `route_name` (VARCHAR)
- `is_active` (BOOLEAN, default `True`)

`RouteStop` remains the same structurally:

- `id` (UUID, PK)
- `route_id` (UUID, FK → `route.id`)
- `stop_name` (VARCHAR, `UNIQUE`)
- `sequence_number` (INTEGER, order of stop in route)

The idea is that route geometry (start/end) will be inferred from the ordered stops rather than dedicated columns on `route`.

## 2. Subscription model context

**File:** `app/models/subscription.py`

The `Subscription` model keeps the 1:1 link to `RouteStop` using the `stop_name` column:

- `user_id` (UUID, FK → `user.id`)
- `stop_name` (`VARCHAR`, `UNIQUE`, FK → `route_stop.stop_name`)
- `status` (`PENDING`, `ACTIVE`, `EXPIRED`)
- `start_date` / `end_date` (DATE, optional)

Because both:

- `route_stop.stop_name` is `UNIQUE`, and
- `subscription.stop_name` is also `UNIQUE`,

the database enforces a **one-to-one** relationship between `subscription` and `route_stop` based on `stop_name`.

## 3. Default routes and stops seeded on startup

**File:** `app/main.py`

During application startup (FastAPI lifespan), the system now:

1. Ensures tables are created:  
   `SQLModel.metadata.create_all(engine)`
2. Ensures the core roles exist: `NORMAL_STAFF`, `FACULTY`, `TO`.
3. Seeds two default routes and their stops if they are not already present.

The seeded data:

- **Route-1**
  - Tongi Station Road
  - Uttara Sector 7
  - Airport
  - Banani
  - Mohakhali
  - Farmgate

- **Route-2**
  - Abdullahpur
  - Mirpur 10
  - Agargaon
  - Bijoy Sarani
  - Shahbagh
  - Motijheel

Implementation outline:

- Use a `route_definitions` mapping in `lifespan`.
- For each `route_name`:
  - Look up an existing `Route` by `route_name`.
  - If missing, create `Route(route_name=..., is_active=True)` and commit.
- For each `stop_name` under that route:
  - Check for an existing `RouteStop` with the same `stop_name`.
  - If missing, create a new `RouteStop` with the route’s `id` and an increasing `sequence_number`.

This ensures:

- The database always contains at least these two routes with consistent stop names.
- Other parts of the system (e.g. subscription creation, frontend dropdowns) can rely on these stops being available by default.

## 4. Test alignment with seeded data

**Files:**
- `tests/test_subscription_post.py`
- `tests/test_subscription_get.py`

To work with the seeded routes/stops and the `stop_name` foreign key, the tests now use real stop names that exist in `route_stop`:

- Subscription POST test uses `stop_name = "Tongi Station Road"` (Route-1).
- Subscription GET test creates a subscription with `stop_name = "Abdullahpur"` (Route-2).

This keeps the tests in sync with:

- The `RouteStop` uniqueness constraint.
- The `Subscription.stop_name` → `RouteStop.stop_name` foreign key.
- The default route network seeded on application startup.

