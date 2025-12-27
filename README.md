# NexusRide Backend

NexusRide is a Transport platform backend built with **FastAPI** and **SQLModel**. This service handles user authentication, role management, and subscription tracking, backed by a PostgreSQL database.

## 📂 Project Structure

```
e:\Projects\NexusRide\
├── app/
│   ├── api/
│   │   └── auth.py          # Authentication endpoints (Signup/Login)
│   ├── core/
│   │   └── security.py      # JWT token generation and configuration
│   ├── db/
│   │   └── session.py       # Database connection and session management
│   ├── models/              # Database models (SQLModel)
│   │   ├── role.py          # Role and UserRole definitions
│   │   ├── subscription.py  # Subscription management
│   │   └── user.py          # User entity definition
│   ├── schemas/             # Pydantic schemas for request/response validation
│   │   └── auth.py          # Schemas for auth requests
│   ├── utils/
│   │   └── hashing.py       # Password hashing utilities
│   └── main.py              # Application entry point
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

## 🚀 Getting Started

Follow these instructions to set up the project on your local machine.

### Prerequisites

*   **Python 3.10+**
*   **PostgreSQL** (Ensure a database instance is running)
*   **Git**

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd NexusRide
    ```

2.  **Create a virtual environment**
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies**
    ```bash
    pip install -r requirements.txt
    ```

### Configuration

The application requires environment variables to connect to the database.

1.  Create a `.env` file in the root directory (same level as `main.py` implies, but usually root).
    *   *Note: The current setup reads `DATABASE_URL` from the system environment or `.env` if loaded explicitly.*

2.  Add the following variable to `.env` (or export it in your shell):

    ```ini
    DATABASE_URL=postgresql://user:password@localhost:5432/nexusride_db
    ```
    *Replace `user`, `password`, `localhost`, and `nexusride_db` with your actual PostgreSQL credentials.*

    *Note: The `SECRET_KEY` for JWT is currently hardcoded in `app/core/security.py`. For production, this should be moved to environment variables.*

## 🏃 Execution

### Running the Application

Start the development server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

### Interactive API Documentation

FastAPI provides automatic interactive documentation. Once the server is running, verify the API by visiting:

*   **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## 📡 API Endpoints

### Authentication (`/auth`)

#### 1. Signup
*   **Endpoint**: `POST /auth/signup`
*   **Description**: Registers a new user with "STAFF" type by default.
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123",
      "full_name": "John Doe"
    }
    ```
*   **Response**: `{"msg": "Signup successful"}`

#### 2. Login
*   **Endpoint**: `POST /auth/login`
*   **Description**: Authenticates a user and returns a JWT access token.
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
      "token_type": "bearer"
    }
    ```

## 🧠 Code Flow & Architecture

### Main Execution Flow
1.  **Entry Point**: `app/main.py` initializes the `FastAPI` app and includes the `auth_router`.
2.  **Request Handling**:
    *   Requests to `/auth/*` are routed to `app/api/auth.py`.
    *   **Signup**: Validates input using `SignupRequest` schema -> Hashes password -> Creates `User` model -> Saves to DB.
    *   **Login**: Validates input -> Retrieves user by email -> Verifies password hash -> Generates JWT token using `app/core/security.py`.
3.  **Database Interaction**:
    *   `app/db/session.py` creates the SQLAlchemy engine and provides a session dependency (`get_session`) used by API routes to interact with the database.

### Database Models

The project uses **SQLModel** (SQLAlchemy + Pydantic) for ORM.

#### Schema Overview

*   **User** (`users` table)
    *   `id`: UUID (Primary Key)
    *   `email`: String (Unique)
    *   `password_hash`: String
    *   `full_name`: String
    *   `user_type`: String (e.g., "STAFF")

*   **Role** (`role` table)
    *   `id`: Integer (Primary Key)
    *   `name`: String (Unique)

*   **UserRole** (`userrole` table)
    *   *Many-to-Many link between User and Role*
    *   `user_id`: String (Foreign Key to `user.id`)
    *   `role_id`: Integer (Foreign Key to `role.id`)

*   **Subscription** (`subscription` table)
    *   `id`: Integer (Primary Key)
    *   `user_id`: String (Foreign Key to `user.id`)
    *   `status`: String (e.g., "PENDING", "ACTIVE")
    *   `start_date`: Date
    *   `end_date`: Date

#### Sample Query (SQLAlchemy style)
```python
# Select a user by email
statement = select(User).where(User.email == "user@example.com")
user = session.exec(statement).first()
```
