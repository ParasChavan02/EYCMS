from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.auth.routers import auth_router
from app.admin.routers import admin_router
from app.accounts.routers import accounts_router
from app.user.routers import user_router
from app.support.routers import support_router
from app.shared.middleware import RequestLoggerMiddleware
from app.shared.exceptions import register_exception_handlers

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Register custom response handlers for errors and input validation exceptions
register_exception_handlers(app)

# Mount logging middleware for API tracing
app.add_middleware(RequestLoggerMiddleware)

# Configure CORS policies dynamically using setting endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register individual sub-modules under standard V1 prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(accounts_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(support_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Health check and greeting endpoint.
    """
    return {"message": "Welcome to E-YUVA ERP Backend API Service"}
