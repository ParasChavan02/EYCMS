import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.core.seed import seed_db

from app.auth.routers import auth_router, admin_tokens_router
from app.admin.routers import admin_router
from app.accounts.routers import accounts_router
from app.user.routers import user_router, notifications_router
from app.support.routers import support_router
from app.teams.routers import router as teams_router
from app.invitations.routers import router as invitations_router
from app.reports.router import router as reports_router

from app.shared.middleware import RequestLoggerMiddleware
from app.shared.exceptions import register_exception_handlers

# -------------------------------------------------------------------
# Initialize Database
# -------------------------------------------------------------------

# Create tables and apply schema updates
init_db()

# Seed default roles and users
db = SessionLocal()
try:
    seed_db(db)
finally:
    db.close()

# -------------------------------------------------------------------
# Create upload directories
# -------------------------------------------------------------------

for folder in [
    "uploads/reports",
    "uploads/bills",
    "uploads/images",
    "uploads/documents",
    "uploads/uc",
    "uploads/other_documents",
]:
    os.makedirs(folder, exist_ok=True)

# -------------------------------------------------------------------
# FastAPI App
# -------------------------------------------------------------------

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# -------------------------------------------------------------------
# Static Files
# -------------------------------------------------------------------

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# -------------------------------------------------------------------
# Exception Handlers
# -------------------------------------------------------------------

register_exception_handlers(app)

# -------------------------------------------------------------------
# Middleware
# -------------------------------------------------------------------

app.add_middleware(RequestLoggerMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Routers
# -------------------------------------------------------------------

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_tokens_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(accounts_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(support_router, prefix=settings.API_V1_STR)
app.include_router(teams_router, prefix=settings.API_V1_STR)
app.include_router(invitations_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

# No root-level endpoints are exposed to enforce API versioning.