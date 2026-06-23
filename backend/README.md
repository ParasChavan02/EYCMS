# E-YUVA ERP Backend Service

FastAPI-powered backend service for the E-YUVA ERP system.

## Tech Stack
- **Framework:** FastAPI
- **Database:** PostgreSQL (with SQLAlchemy 2.0 ORM)
- **Migrations:** Alembic
- **Auth:** JWT (JSON Web Tokens) with bcrypt password hashing

---

## Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- PostgreSQL database instance

### 2. Environment Setup
1. Copy the sample environment file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Adjust the values in `.env`, particularly `DATABASE_URL` and `JWT_SECRET_KEY`.

### 3. Installation
Create a virtual environment and install the required dependencies:

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Running the Development Server
With the virtual environment active, run the FastAPI application using Uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```
The API documentation will be available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 5. Running Database Migrations
Migrations are configured via Alembic. To initialize/run database schema updates:

1. Generate a migration script after changing models:
   ```bash
   alembic revision --autogenerate -m "Initial schema"
   ```
2. Apply migrations to the database:
   ```bash
   alembic upgrade head
   ```
