# How to Run NexusRide Project

This guide provides step-by-step instructions to get the NexusRide project up and running using Docker for the backend and Vite for the frontend.

## Prerequisites

*   **Docker** and **Docker Compose** installed.
*   **Node.js** and **npm** installed.

---

## 1. Start the Backend

The backend (FastAPI) and the database (PostgreSQL) are containerized using Docker. You do not need to run `uvicorn` manually.

1.  Open your terminal.
2.  Navigate to the project root directory:
    ```bash
    cd e:\Projects\NexusRide
    ```
3.  Run the following command to build and start the services:
    ```bash
    docker-compose up --build
    ```
    *   This will start the API server on `http://localhost:8000`.
    *   This will start the PostgreSQL database on port `5433` (mapped to internal `5432`).

    **Note:** Wait for the logs to show `Application startup complete` before proceeding.

---

## 2. Start the Frontend

The frontend is a React application built with Vite.

1.  Open a **new** terminal window.
2.  Navigate to the frontend directory:
    ```bash
    cd e:\Projects\NexusRide\frontend\frontend
    ```
3.  Install dependencies (only required for the first time):
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

---

## 3. Accessing the Application

*   **Frontend UI**: `http://localhost:5173`
*   **Backend API Docs**: `http://localhost:8000/docs` (Swagger UI)

### Troubleshooting

*   **Port Conflicts**: If port `8000` or `5433` is already in use, you may need to modify `docker-compose.yml` or stop the conflicting service.
*   **Database Connection**: The backend is configured to connect to the dockerized database automatically. No manual configuration is needed if you use `docker-compose`.
