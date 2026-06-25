from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.shared.middleware import RequestLoggerMiddleware
from app.shared.exceptions import register_exception_handlers

from app.auth.routers import auth_router
from app.admin.routers import admin_router
from app.accounts.routers import accounts_router
from app.user.routers import user_router
from app.support.routers import support_router

from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

# -------------------------
# App initialization
# -------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)


# -------------------------
# Exception handlers
# -------------------------
register_exception_handlers(app)


# -------------------------
# Middleware
# -------------------------
app.add_middleware(RequestLoggerMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Root endpoint
# -------------------------
@app.get("/")
def root():
    return {"status": "Backend is running 🚀"}


# -------------------------
# Routers (API v1)
# -------------------------
API_PREFIX = settings.API_V1_STR

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(accounts_router, prefix=API_PREFIX)
app.include_router(user_router, prefix=API_PREFIX)
app.include_router(support_router, prefix=API_PREFIX)