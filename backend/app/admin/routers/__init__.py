from app.admin.routers.admin import router as admin_router
from app.admin.routers.uc import router as uc_router
from app.admin.routers.budget_heads import router as budget_heads_router

__all__ = ["admin_router", "uc_router", "budget_heads_router"]