# NexusRide

NexusRide is a transport subscription platform with a FastAPI backend and a React (Vite) frontend. It provides staff and subscriber dashboards, authentication, and subscription management backed by PostgreSQL.

## Overview

- User signup and login with JWT-based authentication.
- Staff dashboard for managing subscriptions and travel tokens.
- Subscriber dashboard for managing monthly subscriptions, routes, and pickup locations.
- PostgreSQL database with SQLModel models for users, roles, routes, trips, tokens, and subscriptions.

## Tech Stack

- **Backend:** FastAPI, SQLModel, Uvicorn.
- **Frontend:** React 19, Vite, Tailwind-based styling, React Router.
- **Database:** PostgreSQL.
- **Infrastructure:** Docker and Docker Compose for local development.

## Project Structure

High-level layout of the repository:

```text
NexusRide/
├── app/              # FastAPI application (API, models, schemas, core)
├── frontend/
│   └── frontend/     # React + Vite single-page application
├── tests/            # API tests and helpers
├── Docs/             # Design notes and implementation logs
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## Getting Started

### Prerequisites

- Docker and Docker Compose.
- Node.js and npm (for frontend development).
- Python 3.10+ (for running backend or tests directly).

### Quickstart with Docker

From the project root:

```bash
docker-compose up --build
```

This will:

- Start PostgreSQL on `localhost:5433`.
- Start the FastAPI backend on `http://localhost:8000`.

### Run the Frontend

In a separate terminal:

```bash
cd frontend/frontend
npm install        # first time only
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

## API and Frontend

- Backend base URL: `http://localhost:8000`
  - Interactive docs (Swagger): `http://localhost:8000/docs`
- Frontend UI (development): typically `http://localhost:5173`

The frontend talks to the backend via REST endpoints defined under `app/api/` (authentication, subscriptions, trips, etc.).

## Running Tests

Backend integration tests live in the `tests/` directory.

Typical flow:

1. Create and activate a virtual environment.
2. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI app.
4. Run the test scripts in `tests/` (see `tests/how_to_test.txt` for exact commands).

## Additional Documentation

More detailed design notes and implementation logs are under `Docs/`, including:

- `Docs/database-schema.md` – current database schema.
- `Docs/how-to-run.md` – step-by-step run instructions.
- `Docs/modifications/...` – change logs for subscription and routing features.
