from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, verify_user
from app.common.models.user import User
from app.user.schemas import (
    FellowDashboardKPIs,
    FellowTransactionItem,
    UCRequestPayload
)
from app.user.services import UserService
from app.user.services.dashboard_service import UserDashboardService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/user", tags=["Fellow Operations"], dependencies=[Depends(verify_user)])

@router.get("/dashboard", response_model=ResponseEnvelope[FellowDashboardKPIs])
def get_dashboard_kpis(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    try:
        kpis = UserDashboardService.get_dashboard_kpis(db, str(current_user.id))
        return make_success_response(kpis)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/transactions", response_model=ResponseEnvelope[List[FellowTransactionItem]])
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    try:
        transactions = UserService.get_transactions(db, str(current_user.id))
        return make_success_response(transactions)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/uc-request", response_model=ResponseEnvelope[dict])
def submit_uc_request(
    payload: UCRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_user)
):
    try:
        result = UserService.submit_uc_request(db, payload, str(current_user.id))
        return make_success_response(result)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
