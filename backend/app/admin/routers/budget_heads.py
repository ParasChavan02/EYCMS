from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, verify_admin, get_current_user, require_super_admin
from app.core.permissions import RoleChecker
from app.common.constants.enums import RoleEnum
from app.common.models.user import User
from app.admin.schemas.budget_heads import (
    EYCAllocationCreate,
    EYCThreeLevelBudgetOverview
)
from app.admin.services.budget_heads_service import BudgetHeadsService
from app.shared.responses import ResponseEnvelope, make_success_response


def verify_admin_or_accounts(current_user: User = Depends(get_current_user)) -> User:
    checker = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.ACCOUNTS])
    return checker(current_user)


router = APIRouter(prefix="/admin/budget-heads", tags=["Admin Budget Heads"])


@router.get("/overview", response_model=ResponseEnvelope[EYCThreeLevelBudgetOverview])
def get_budget_heads_overview(db: Session = Depends(get_db), _: User = Depends(verify_admin_or_accounts)):
    try:
        data = BudgetHeadsService.get_overview(db)
        # Manually validate using Pydantic to catch any schema mismatch errors
        validated = EYCThreeLevelBudgetOverview(**data)
        return make_success_response(validated)
    except HTTPException as e:
        import traceback
        with open(r"d:\Projects\EYCMS Main\EYCMS_2\backend\error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        raise
    except Exception as e:
        import traceback
        with open(r"d:\Projects\EYCMS Main\EYCMS_2\backend\error_log.txt", "w") as f:
            f.write(f"Exception: {str(e)}\n" + traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/allocate", response_model=ResponseEnvelope[dict])
def allocate_eyc_budget(
    payload: EYCAllocationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        data = BudgetHeadsService.allocate_eyc_budget(db, current_admin, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/common-budget", response_model=ResponseEnvelope[dict])
def add_common_budget_entry(
    payload: EYCAllocationCreate,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin)
):
    try:
        data = BudgetHeadsService.add_common_budget_entry(db, current_super_admin, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/super-overview", response_model=ResponseEnvelope[dict])
def get_super_admin_overview(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin)
):
    try:
        data = BudgetHeadsService.get_super_admin_overview(db)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/super-allocate", response_model=ResponseEnvelope[dict])
def super_allocate_budget(
    payload: EYCAllocationCreate,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(require_super_admin)
):
    try:
        data = BudgetHeadsService.super_allocate_budget(db, current_super_admin, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/custom-category", response_model=ResponseEnvelope[dict])
def add_custom_category(
    payload: EYCAllocationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        data = BudgetHeadsService.add_custom_category(db, current_admin, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/fellow-allocate", response_model=ResponseEnvelope[dict])
def allocate_fellow_budget(
    payload: EYCAllocationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        data = BudgetHeadsService.allocate_fellow_budget(db, current_admin, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ---------- Legacy Stubs (to prevent frontend fetch or route mapping issues) ----------

@router.get("/users/{user_id}")
def get_user_budget_detail(user_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin_or_accounts)):
    return make_success_response({})


@router.post("/users/{user_id}/allocation")
def allocate_budget(user_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin)):
    return make_success_response({})


@router.put("/allocations/{allocation_id}")
def update_allocation(allocation_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin)):
    return make_success_response({})


@router.post("/users/{user_id}/spending")
def add_spending_category(user_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin)):
    return make_success_response({})


@router.put("/spending/{spending_id}")
def update_spending_category(spending_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin)):
    return make_success_response({})


@router.delete("/spending/{spending_id}")
def delete_spending_category(spending_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin)):
    return make_success_response({})
