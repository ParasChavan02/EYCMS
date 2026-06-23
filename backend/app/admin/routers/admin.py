from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.dependencies import get_db, verify_admin
from app.common.models.user import User
from app.admin.schemas import (
    AdminDashboardKPIs,
    UserProgressMonitoring,
    UserProgressDetail,
    AdminCreateTransaction,
    AdminTransactionReview
)
from app.admin.services import AdminService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(verify_admin)])

@router.get("/dashboard", response_model=ResponseEnvelope[AdminDashboardKPIs])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    try:
        kpis = AdminService.get_dashboard_kpis(db)
        return make_success_response(kpis)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users", response_model=ResponseEnvelope[List[UserProgressMonitoring]])
def get_users_progress(
    status_filter: Optional[str] = Query(None, alias="status"),
    search_query: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db)
):
    try:
        progress = AdminService.get_users_progress(db, status_filter, search_query)
        return make_success_response(progress)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users/{user_id}", response_model=ResponseEnvelope[UserProgressDetail])
def get_user_progress_detail(user_id: str, db: Session = Depends(get_db)):
    try:
        detail = AdminService.get_user_progress_detail(db, user_id)
        return make_success_response(detail)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/transactions", response_model=ResponseEnvelope[dict])
def admin_create_transaction(
    transaction_data: AdminCreateTransaction,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        transaction = AdminService.admin_create_transaction(db, transaction_data, str(current_admin.id))
        return make_success_response(transaction)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/transactions/review", response_model=ResponseEnvelope[dict])
def review_transaction(
    review_data: AdminTransactionReview,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        review_result = AdminService.review_transaction(db, review_data, str(current_admin.id))
        return make_success_response(review_result)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
