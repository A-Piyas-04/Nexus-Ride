# NexusRide

NexusRide is a ride-sharing platform designed to provide seamless transportation solutions. This repository houses the backend infrastructure and project documentation.

## Project Structure

- **nexusride-backend/**: The core backend service built with Python and FastAPI.
- **Requirement analysis/**: Documentation regarding project requirements, schemas, and features.

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

- **Python 3.10+**: The project relies on Python for the backend logic.
- **PostgreSQL**: Used as the primary database (implied by project dependencies).
- **Git**: For version control.

## Backend Environment Setup

Follow these detailed steps to configure the backend development environment.

### 1. Clone the Repository (If not already done)
```bash
git clone <repository-url>
cd NexusRide
```

### 2. Navigate to the Backend Directory
Move into the backend folder where the Python project resides:
```bash
cd nexusride-backend
```

### 3. Create a Virtual Environment
Isolate the project dependencies by creating a virtual environment named `venv`:
```bash
python -m venv venv
```

### 4. Activate the Virtual Environment
Activate the environment to ensure you are using the isolated Python instance:

- **Windows (Command Prompt/PowerShell):**
  ```powershell
  venv\Scripts\activate
  ```
  *You should see `(venv)` appear at the beginning of your command line.*

- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

### 5. Install Dependencies
Install all required Python packages as listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 6. Environment Configuration
The project uses `python-dotenv` to manage environment variables.

1. Create a file named `.env` in the `nexusride-backend` directory.
2. Add necessary configuration variables (e.g., Database URL, Secret Keys).
   *Example structure:*
   ```ini
   DATABASE_URL=postgresql://user:password@localhost/dbname
   SECRET_KEY=your_secret_key
   ```

### 7. Running the Application
*Note: Ensure the virtual environment is activated.*

Start the FastAPI server using Uvicorn:
```bash
uvicorn main:app --reload
```
*(Note: Replace `main:app` with the actual entry point if different, e.g., `app.main:app`)*

## Troubleshooting

- **Pip upgrade**: If you encounter installation errors, try upgrading pip:
  ```bash
  python -m pip install --upgrade pip
  ```
- **PostgreSQL Driver**: If `psycopg2-binary` fails to install, ensure you have PostgreSQL development libraries installed on your system, or try installing `psycopg2` instead.
