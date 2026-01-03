# NexusRide Auth & Infrastructure Changes – Detailed Session Log

## 0. High-Level Summary

- **What we did**: Hardened the authentication stack, containerized the app reliably, fixed database schema issues, and ensured that user data (including signup data) is stored persistently in PostgreSQL.
- **Why**: The original setup had:
  - Fragile dependency versions (bcrypt/passlib mismatch),
  - Missing automatic database initialization,
  - Schema type mismatches on foreign keys,
  - And no clear guarantee that data would survive container restarts.
- **Outcome**:
  - `POST /auth/signup` and `POST /auth/login` now work end-to-end inside Docker.
  - Database tables are created automatically on startup.
  - User records persist across container restarts via a Docker volume.
  - The project has clear documentation and a reproducible setup.

---

## 1. Documentation & Project Structure

### 1.1 What we changed

- Created `README.md` with:
  - Project overview and goals.
  - Directory and module structure.
  - Step-by-step environment setup.
  - How to run the app (locally and via Docker).
  - Basic API usage examples.
- Created `.gitignore` with entries for:
  - Python artifacts (`venv`, `__pycache__`, `.pyc` files).
  - Environment files (like `.env`).
  - IDE/editor metadata.
  - Docker-related temporary files.

### 1.2 Why the change was needed

- Without a README, onboarding a new developer is slow and error-prone: they must infer required tools, environment variables, and commands by reading the code.
- Without a solid `.gitignore`, there is a high risk of:
  - Committing large or irrelevant files (virtual environments, caches).
  - Accidentally committing secrets or local configuration (`.env`).

### 1.3 Where the changes live

- `README.md` — central project documentation.
- `.gitignore` — repository hygiene and secret protection.

### 1.4 Effect of the change

- New developers can quickly get the project running by following explicit instructions.
- The repository remains cleaner and safer (no virtualenvs or secrets in version control).

---

## 2. Environment Configuration & Bcrypt/Passlib Error

### 2.1 What we changed

**Files involved**

- `.env`
- `requirements.txt`
- `app/main.py`

**Concrete changes**

- Created `.env` to hold configuration values:
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/transport`
  - `SECRET_KEY=supersecretkey123`
- Updated `requirements.txt`:
  - Added `python-dotenv` to load environment variables from `.env`.
  - Pinned `bcrypt` to a specific version:
    - `bcrypt==4.0.1`
- Updated `app/main.py` to:
  - Call `load_dotenv()` early so that environment variables are available to the app and database layer.

### 2.2 What error we saw

When starting the app and hitting authentication-related code, we saw an error similar to:

```text
AttributeError: module 'bcrypt' has no attribute '__about__'
```

This came from the `passlib` library at import time (before handling any actual request).

### 2.3 Why this error happened

- `passlib` (with the `bcrypt` extra) expects the `bcrypt` library to expose a module attribute named `__about__` containing version metadata.
- Newer versions of `bcrypt` (4.1.x and above) removed this attribute.
- As a result, when `passlib` tried to read `bcrypt.__about__.__version__`, it failed with `AttributeError`.
- This is a compatibility problem between the version of `passlib` in use and the latest `bcrypt` releases.

### 2.4 How we fixed it

- In `requirements.txt`, we explicitly pinned:

```text
bcrypt==4.0.1
```

- This version still provides the `__about__` attribute that `passlib` expects.
- After updating `requirements.txt`, we rebuilt the Docker image so the container installs the correct version.
- Once the image was rebuilt and containers restarted, the `AttributeError` disappeared and password hashing worked correctly.

### 2.5 Effect of the fix

- Authentication code that relies on `passlib` and `bcrypt` now loads and runs without runtime errors.
- `POST /auth/signup` and `POST /auth/login` are able to hash and verify passwords as intended.

---

## 3. Docker Setup & Data Persistence

### 3.1 What we changed

**Files involved**

- `docker-compose.yml`
- `.dockerignore`

**Concrete changes**

- Created `.dockerignore` to prevent unnecessary files from being sent to the Docker build context (e.g. `venv`, `.env`, temporary files).
- Updated `docker-compose.yml`:
  - Set the database service:
    - Image: `postgres:15`
    - Port mapping: host `5433` → container `5432`
    - Named volume: `postgres_data:/var/lib/postgresql/data` for persistent storage.
    - `restart: always` to improve resilience.
  - Set the API service:
    - Image built from the local project (`nexusride-api`).
    - Port mapping: host `8000` → container `8000`.
    - Environment variables:
      - `DATABASE_URL` (pointing at the `db` container).
      - `SECRET_KEY`, `ALGORITHM`, and other auth-related config.
    - `restart: always`.

### 3.2 Why this change was needed

- Without a proper Docker configuration:
  - Running the app requires manually managing Python, Postgres, and environment variables on each machine.
  - Database data can be wiped whenever containers are recreated if no volume is configured.
- By introducing Docker Compose:
  - Local development and deployment become predictable and reproducible.
  - The Postgres data directory is stored in a named volume (`postgres_data`), so data survives container restarts and recreations.

### 3.3 Effect of the change

- You can now start the full stack with:

```bash
docker-compose up -d
```

- Tables and data in PostgreSQL persist even if containers are stopped or recreated, thanks to the named volume.

---

## 4. Database Initialization & Schema Fixes

This section covers two issues:

1. Tables not being created automatically.
2. Foreign key type mismatches between `user.id` and related models.

### 4.1 Missing table creation on startup

#### 4.1.1 What was happening

- You had SQLModel models defined for `User`, `Role`, `UserRole`, and `Subscription` but no code that actually created the tables in the database.
- When calling `POST /auth/signup` for the first time, the API tried to insert into the `user` table, which did not exist yet.

#### 4.1.2 Error observed

The error looked like:

```text
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedTable) relation "user" does not exist
```

#### 4.1.3 Why this error occurred

- SQLModel (and SQLAlchemy in general) does not automatically create tables just because models exist.
- You must either:
  - Run migrations (e.g. Alembic), or
  - Call `SQLModel.metadata.create_all(engine)` at startup.
- Since neither was happening, PostgreSQL had no `user` table when the first insert was attempted.

#### 4.1.4 How we fixed it

- Updated `app/main.py` to define a FastAPI `lifespan` handler.
- Inside the startup phase of that handler, we call:

```python
from sqlmodel import SQLModel
from app.db.session import engine

SQLModel.metadata.create_all(engine)
```

- This ensures that, when the API container starts, all tables defined by your SQLModel models are created in the target database before handling any request.

#### 4.1.5 Effect of the fix

- The first call to `POST /auth/signup` now succeeds instead of failing with "relation does not exist".
- All required tables (`user`, `role`, `subscription`, `userrole`) are guaranteed to exist on startup.

---

### 4.2 Foreign key datatype mismatch

#### 4.2.1 What was happening

- After enabling automatic table creation, PostgreSQL complained when trying to create foreign key constraints for `UserRole` and `Subscription`.

#### 4.2.2 Error observed

The error (simplified) looked like:

```text
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DatatypeMismatch)
  foreign key constraint ... cannot be implemented
```

#### 4.2.3 Why this error occurred

- The `User` model uses a `UUID` type for its primary key (`id`).
- In contrast, the `UserRole` and `Subscription` models originally declared their `user_id` fields as `str` (which SQLModel maps to a string/varchar type in PostgreSQL).
- PostgreSQL requires that a foreign key column have the **same data type** as the column it references.
- Because `user.id` was `UUID` and `userrole.user_id` / `subscription.user_id` were string types, Postgres refused to create the foreign key constraints.

#### 4.2.4 How we fixed it

- Updated the models so that the foreign key columns use `UUID` instead of `str`.
- Specifically:
  - In `app/models/role.py`:
    - Changed `user_id` from `str` to `UUID` while keeping `foreign_key="user.id"`.
  - In `app/models/subscription.py`:
    - Changed `user_id` from `str` to `UUID` with the same foreign key.
- After this change, both sides of each foreign key (`user.id` and the referencing `user_id`) share the same data type (`UUID`).

#### 4.2.5 Effect of the fix

- `SQLModel.metadata.create_all(engine)` now completes successfully.
- Foreign key constraints are properly created and enforced by PostgreSQL:
  - Each `UserRole` and `Subscription` row must reference a valid `User.id`.
- The schema is consistent and aligned with the model definitions.

---

## 5. Verification & Data Persistence (Including Signup Data)

This section shows how we verified:

1. That the tables exist in the database.
2. That signup data is actually stored.
3. That the data persists even after restarting containers (thanks to Docker volumes).

### 5.1 Verifying that tables exist

With the Docker Compose stack running, we listed tables inside the Postgres container:

```bash
docker exec nexusride-db-1 psql -U postgres -d transport -c "\dt"
```

Output:

```text
            List of relations
 Schema |     Name     | Type  |  Owner   
--------+--------------+-------+----------
 public | role         | table | postgres
 public | subscription | table | postgres
 public | user         | table | postgres
 public | userrole     | table | postgres
(4 rows)
```

This confirms that all required tables (`user`, `role`, `subscription`, `userrole`) are present in the `transport` database.

### 5.2 Verifying that signup data is stored

After calling `POST /auth/signup` with user details (for example, `ahnaf@example.com`), we queried the `user` table directly from inside the container:

```bash
'SELECT email, full_name FROM "user";' \
  | docker exec -i nexusride-db-1 psql -U postgres -d transport
```

Example output:

```text
       email        | full_name 
--------------------+-----------
 ahnaf@example.com  | ahnaf
 user@example.com   | string
 user1@example.com  | user
 user12@example.com | user
 user13@example.com | user
(5 rows)
```

This confirms:

- Each successful signup inserts a row into the `user` table.
- The data includes at least the `email` and `full_name` fields, as expected.

### 5.3 Verifying persistence across container restarts

To prove that data is stored **permanently** (i.e., survives container restarts), we:

1. Ensured the services were running via:

   ```bash
   docker-compose up -d
   ```

2. Queried the `user` table and observed several rows (including `ahnaf@example.com` as shown above).
3. Restarted the stack (containers may be recreated, but the `postgres_data` volume is reused).
4. Ran the same query again:

   ```bash
   'SELECT email, full_name FROM "user";' \
     | docker exec -i nexusride-db-1 psql -U postgres -d transport
   ```

5. Observed that the same rows were still present.

Because the Postgres container uses a named Docker volume:

```yaml
volumes:
  postgres_data:
```

and mounts it at `/var/lib/postgresql/data`, the database files remain on disk even if the container is destroyed and recreated.

### 5.4 Conclusion about data permanence

- **Yes, signup data is stored permanently** in the PostgreSQL database (as long as the `postgres_data` volume is not deleted).
- Each call to `POST /auth/signup`:
  - Creates a `user` row,
  - Which is then visible through direct SQL queries from inside the container,
  - And survives container restarts due to the Docker volume configuration.

---

## 6. Authentication Endpoint Verification

### 6.1 Signup (`POST /auth/signup`)

- **Action**: Sent a request with:

  ```json
  {
    "email": "ahnaf@example.com",
    "password": "qwertyuiop",
    "full_name": "ahnaf"
  }
  ```

- **Expected behavior**:
  - Hash the password using `passlib[bcrypt]`.
  - Insert a new row into the `user` table.
  - Return a response confirming user creation.

- **Result**:
  - Request succeeded.
  - A corresponding row appeared in the `user` table (confirmed via psql).

### 6.2 Login (`POST /auth/login`)

- **Action**: Sent a request with the same email and password.
- **Expected behavior**:
  - Look up the user by email.
  - Verify the submitted password against the stored bcrypt hash.
  - Issue a JWT access token signed with `SECRET_KEY` and `ALGORITHM`.
- **Result**:
  - Request succeeded.
  - The endpoint returned a valid JWT token in the response.

---

## 7. Summary of Key Lessons

- Pinning library versions matters: a minor change in `bcrypt` broke `passlib` until we pinned `bcrypt==4.0.1`.
- ORMs do not automatically create tables; you must either run migrations or call `create_all` during startup.
- Foreign key column types must match the referenced primary key types (`UUID` vs `str`) in PostgreSQL.
- Docker volumes (like `postgres_data`) are essential for preserving database data across container restarts.

---

## 8. Auth Input Validation Hardening (Latest Changes)

After the initial work described above, we further tightened the authentication layer to enforce stronger input validation and stricter request schemas.

### 8.1 Password length constraints

**Files involved**

- `app/schemas/auth.py`

**What we changed**

- Updated `SignupRequest` and `LoginRequest` schemas to use constrained string types for passwords:

  ```python
  from pydantic import EmailStr, constr

  class SignupRequest(SQLModel):
      email: EmailStr
      password: constr(min_length=8, max_length=128)
      full_name: constr(min_length=1, max_length=100)

  class LoginRequest(SQLModel):
      email: EmailStr
      password: constr(min_length=8, max_length=128)
  ```

**Why this matters**

- Enforces a minimum password length of 8 characters for both signup and login requests.
- Prevents abnormally long passwords (over 128 characters), reducing the risk of abuse and making validation rules explicit at the API boundary.

### 8.2 Forbidding extra fields in auth payloads

**Files involved**

- `app/schemas/auth.py`

**What we changed**

- Added `Config` classes to both auth request schemas to reject unknown fields:

  ```python
  class SignupRequest(SQLModel):
      ...

      class Config:
          extra = "forbid"

  class LoginRequest(SQLModel):
      ...

      class Config:
          extra = "forbid"
  ```

**Effect**

- Any extra/unexpected fields sent in `POST /auth/signup` or `POST /auth/login` are now rejected with a validation error (`422`), tightening the API surface.

### 8.3 Email normalization on signup and login

**Files involved**

- `app/api/auth.py`

**What we changed**

- Normalized email addresses in both `signup` and `login` endpoints before storing or querying:

  ```python
  @router.post("/signup")
  def signup(data: SignupRequest, session: Session = Depends(get_session)):
      email = data.email.strip().lower()
      ...

  @router.post("/login")
  def login(data: LoginRequest, session: Session = Depends(get_session)):
      email = data.email.strip().lower()
      ...
  ```

**Effect**

- Prevents issues caused by leading/trailing whitespace or inconsistent casing in email addresses.
- Ensures that email uniqueness and lookups are consistent (`User.email` is effectively treated as case-insensitive from the API’s perspective).


