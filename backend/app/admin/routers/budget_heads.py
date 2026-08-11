from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, verify_admin, get_current_user
from app.core.permissions import RoleChecker
from app.common.constants.enums import RoleEnum
from app.common.models.user import User
from app.admin.schemas.budget_heads import (
    BudgetHeadsOverview,
    UserBudgetDetail,
    UserBudgetSummary,
    BudgetAllocationCreate,
    BudgetAllocationUpdate,
    BudgetSpendingCreate,
    BudgetSpendingUpdate,
    BudgetSpendingItem,
)
from app.admin.services.budget_heads_service import BudgetHeadsService
from app.shared.responses import ResponseEnvelope, make_success_response


def verify_admin_or_accounts(current_user: User = Depends(get_current_user)) -> User:
    """
    Local wrapper mirroring how require_admin/require_accounts are built in
    app.core.dependencies — RoleChecker instances are not themselves valid
    FastAPI dependency callables (their __call__ takes a plain `current_user:
    User` with no Depends default), so they must be invoked from inside a
    function that resolves current_user via Depends(get_current_user) first.
    """
    checker = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.ACCOUNTS])
    return checker(current_user)


# No router-level dependency: GET (read) routes are opened up to Accounts/Finance
# as well via verify_admin_or_accounts below, while every write route (POST/PUT/DELETE)
# stays locked to verify_admin (Admin/Super Admin only) on each endpoint individually.
router = APIRouter(prefix="/admin/budget-heads", tags=["Admin Budget Heads"])


@router.get("/overview", response_model=ResponseEnvelope[BudgetHeadsOverview])
def get_budget_heads_overview(db: Session = Depends(get_db), _: User = Depends(verify_admin_or_accounts)):
    try:
        data = BudgetHeadsService.get_overview(db)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/users/{user_id}", response_model=ResponseEnvelope[UserBudgetDetail])
def get_user_budget_detail(user_id: str, db: Session = Depends(get_db), _: User = Depends(verify_admin_or_accounts)):
    try:
        data = BudgetHeadsService.get_user_detail(db, user_id)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/users/{user_id}/allocation", response_model=ResponseEnvelope[UserBudgetSummary])
def allocate_budget(
    user_id: str,
    payload: BudgetAllocationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        data = BudgetHeadsService.allocate_budget(db, current_admin, user_id, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/allocations/{allocation_id}", response_model=ResponseEnvelope[UserBudgetSummary])
def update_allocation(
    allocation_id: str,
    payload: BudgetAllocationUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        data = BudgetHeadsService.update_allocation(db, current_admin, allocation_id, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/users/{user_id}/spending", response_model=ResponseEnvelope[BudgetSpendingItem])
def add_spending_category(
    user_id: str,
    payload: BudgetSpendingCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        data = BudgetHeadsService.add_spending(db, current_admin, user_id, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/spending/{spending_id}", response_model=ResponseEnvelope[BudgetSpendingItem])
def update_spending_category(
    spending_id: str,
    payload: BudgetSpendingUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        data = BudgetHeadsService.update_spending(db, current_admin, spending_id, payload)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/spending/{spending_id}", response_model=ResponseEnvelope[dict])
def delete_spending_category(
    spending_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin),
):
    try:
        data = BudgetHeadsService.delete_spending(db, current_admin, spending_id)
        return make_success_response(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
