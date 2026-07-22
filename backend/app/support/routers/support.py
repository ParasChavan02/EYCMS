from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.common.models.user import User
from app.support.schemas import (
    SupportTicketCreate,
    SupportTicketResponse,
    FeatureRequestCreate,
    FeatureRequestStatusUpdate,
    FeatureRequestResponse
)
from app.support.services import SupportService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/support", tags=["Support Operations"], dependencies=[Depends(get_current_user)])

@router.post("/ticket", response_model=ResponseEnvelope[SupportTicketResponse])
def create_ticket(
    payload: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ticket = SupportService.create_ticket(db, payload, str(current_user.id))
        return make_success_response(ticket)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/tickets", response_model=ResponseEnvelope[List[SupportTicketResponse]])
def list_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        tickets = SupportService.list_user_tickets(db, str(current_user.id))
        return make_success_response(tickets)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ============ FEATURE REQUEST ENDPOINTS ============

@router.post("/feature-request", response_model=ResponseEnvelope[FeatureRequestResponse])
def create_feature_request(
    payload: FeatureRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        req = SupportService.create_feature_request(db, payload, str(current_user.id))
        return make_success_response(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/feature-requests", response_model=ResponseEnvelope[List[FeatureRequestResponse]])
def list_feature_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        requests = SupportService.list_feature_requests(db)
        return make_success_response(requests)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/feature-requests/{request_id}/status", response_model=ResponseEnvelope[FeatureRequestResponse])
def update_feature_request_status(
    request_id: str,
    payload: FeatureRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        req = SupportService.update_feature_request_status(db, request_id, payload.status, payload.comments)
        return make_success_response(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/feature-requests/{request_id}/vote", response_model=ResponseEnvelope[FeatureRequestResponse])
def vote_feature_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        req = SupportService.vote_feature_request(db, request_id)
        return make_success_response(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

