from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.common.models.user import User
from app.support.schemas import (
    SupportTicketCreate,
    SupportTicketResponse
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
        tickets = SupportService.list_tickets(db, str(current_user.id))
        return make_success_response(tickets)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
