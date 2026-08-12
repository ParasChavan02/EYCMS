from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, verify_accounts
from app.accounts.schemas import (
    AccountsDashboardKPIs,
    AccountsTransactionItem,
    AccountsBudgetItem,
)
from app.accounts.services import AccountsService
from app.shared.responses import ResponseEnvelope, make_success_response

# Every route on this router is already gated to SUPER_ADMIN / ACCOUNTS via
# verify_accounts, and only GET (read) endpoints are defined below, so the
# Accounts role can never reach a write operation through this module.
router = APIRouter(prefix="/accounts", tags=["Accounts Operations"], dependencies=[Depends(verify_accounts)])


@router.get("/dashboard", response_model=ResponseEnvelope[AccountsDashboardKPIs])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    try:
        kpis = AccountsService.get_dashboard_kpis(db)
        return make_success_response(kpis)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/transactions", response_model=ResponseEnvelope[List[AccountsTransactionItem]])
def get_transactions(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        transactions = AccountsService.get_transactions(db, status_filter, search)
        return make_success_response(transactions)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/budget", response_model=ResponseEnvelope[List[AccountsBudgetItem]])
def get_budget_overview(db: Session = Depends(get_db)):
    try:
        budgets = AccountsService.get_budget_overview(db)
        return make_success_response(budgets)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
