from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, verify_accounts
from app.common.models.user import User
from app.accounts.schemas import (
    AccountsDashboardKPIs,
    LedgerEntry,
    StatementReconciliationPayload
)
from app.accounts.services import AccountsService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/accounts", tags=["Accounts Operations"], dependencies=[Depends(verify_accounts)])

@router.get("/dashboard", response_model=ResponseEnvelope[AccountsDashboardKPIs])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    try:
        kpis = AccountsService.get_dashboard_kpis(db)
        return make_success_response(kpis)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/ledger", response_model=ResponseEnvelope[List[LedgerEntry]])
def get_ledger(db: Session = Depends(get_db)):
    try:
        ledger = AccountsService.get_ledger(db)
        return make_success_response(ledger)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/reconcile", response_model=ResponseEnvelope[dict])
def reconcile_statement(
    payload: StatementReconciliationPayload,
    db: Session = Depends(get_db),
    current_accountant: User = Depends(verify_accounts)
):
    try:
        result = AccountsService.reconcile_statement(db, payload, str(current_accountant.id))
        return make_success_response(result)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
