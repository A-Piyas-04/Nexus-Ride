# DB Lookup Scripts

This directory contains a GUI tool to inspect the data in the PostgreSQL database.

## Prerequisites

- The database container must be running:
  ```bash
  docker-compose up -d db
  ```
- The database must be accessible on `localhost:5433` (default configuration in `docker-compose.yml`).
- Python environment with dependencies installed (`pip install -r requirements.txt`).

## Scripts

### GUI Database Viewer (Desktop App)

A feature-rich desktop application to browse tables interactively.

Run the following command to open the GUI popup:

```bash
python tests/db-lookup/gui_db_viewer.py
```

**Features:**
- **Table Browser**: Select any table from the left sidebar.
- **Data Grid**: View data in a structured table format.
- **Search**: Filter rows instantly by typing in the search box (top right).
- **Sort**: Click on any column header to sort data (click again to reverse).
- **Refresh**: Reload data from the database with the "Refresh" button.
- **Status Bar**: Shows loading status and record counts.

**Available Tables:**
- user, role, user_role
- subscription, subscription_leave
- route, route_stop
- vehicle, trip, seat_allocation
- payment, notification, token
- staff_profile, driver_profile
