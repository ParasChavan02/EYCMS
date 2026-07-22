import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
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

# Run programmatic database schema checks and creation
init_db()

# Ensure local upload directory structure exists
for folder in ["uploads/reports", "uploads/bills", "uploads/images", "uploads/documents", "uploads/uc", "uploads/other_documents"]:
    os.makedirs(folder, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount static files for uploads directory to enable file previews and downloads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register custom response handlers for errors and input validation exceptions
register_exception_handlers(app)

# Mount logging middleware for API tracing
app.add_middleware(RequestLoggerMiddleware)

# Configure CORS policies dynamically using setting endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register individual sub-modules under standard V1 prefix
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


