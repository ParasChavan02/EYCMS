from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.dependencies import get_db, verify_user
from app.common.models.user import User
from app.user.schemas import (
    FellowDashboardKPIs,
    FellowTransactionItem,
    UCRequestPayload
)
from app.support.schemas import (
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketMessageResponse,
    SupportTicketMessageCreate
)
from app.notifications.schemas import (
    NotificationResponse
)
from app.user.services import UserService
from app.user.services.dashboard_service import UserDashboardService
from app.support.services import SupportService
from app.notifications.services.notification_service import NotificationService
from app.shared.responses import ResponseEnvelope, make_success_response
from pydantic import BaseModel

router = APIRouter(prefix="/user", tags=["Fellow Operations"], dependencies=[Depends(verify_user)])

# Helper action trigger payload
class ActionTriggerPayload(BaseModel):
    action_type: str  # e.g., "report_upload", "transaction_update", "team_invite", "event_creation", "bill_verification"
    title: str
    message: str
    notification_type: str = "info"
    target_roles: Optional[List[str]] = None
    project_id: Optional[str] = None
    action_path: Optional[str] = None
    action_label: Optional[str] = None

# ============ FELLOW DASHBOARD & TRANSACTIONS ============

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
        
        # Automatically generate notifications for Admins and Accounts (Finance)
        from app.common.constants.enums import RoleEnum
        NotificationService.broadcast_notification(
            db=db,
            title="UC Request Submitted",
            message=f"Fellow {current_user.name} requested UC template of amount Rs.{payload.amount}.",
            type="info",
            roles=[RoleEnum.ADMIN.value, RoleEnum.ACCOUNTS.value],
            action_path="/admin/approvals",  # Admin approvals routing
            action_label="Review approvals"
        )
        
        return make_success_response(result)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ============ SUPPORT DESK (USER OPERATIONS) ============

@router.post("/support/ticket", response_model=ResponseEnvelope[SupportTicketResponse])
def create_ticket(
    payload: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_user)
):
    try:
        ticket = SupportService.create_ticket(db, payload, str(current_user.id))
        return make_success_response(ticket)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/support/tickets", response_model=ResponseEnvelope[List[SupportTicketResponse]])
def list_tickets(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    try:
        tickets = SupportService.list_user_tickets(db, str(current_user.id))
        return make_success_response(tickets)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/support/tickets/{ticket_id}", response_model=ResponseEnvelope[SupportTicketResponse])
def get_ticket(ticket_id: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    try:
        ticket = SupportService.get_ticket_by_id(db, ticket_id)
        # Check permission: Users can only view their own tickets
        if ticket.user.id != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return make_success_response(ticket)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/support/tickets/{ticket_id}/message", response_model=ResponseEnvelope[SupportTicketMessageResponse])
def add_message(
    ticket_id: str,
    payload: SupportTicketMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_user)
):
    try:
        # Check ticket exists and is created by this user
        ticket = SupportService.get_ticket_by_id(db, ticket_id)
        if ticket.user.id != str(current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        msg = SupportService.add_message(
            db=db,
            ticket_id=ticket_id,
            message=payload.message,
            attachments=payload.attachments,
            is_admin_reply=False,
            sender_id=str(current_user.id)
        )
        return make_success_response(msg)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ============ ACTION TRIGGER HELPER ============

@router.post("/actions/trigger", response_model=ResponseEnvelope[dict])
def trigger_action(
    payload: ActionTriggerPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_user)
):
    """
    Unified action hook triggered by the frontend to record system events
    and distribute notifications to the correct targets (Admin, Finance, or specific roles/projects).
    """
    try:
        # Default roles to notify
        from app.common.constants.enums import RoleEnum
        target_roles = payload.target_roles
        
        if not target_roles:
            # If no roles defined, notify ADMIN by default
            target_roles = [RoleEnum.ADMIN.value]
            
        # Create notifications via broadcast
        NotificationService.broadcast_notification(
            db=db,
            title=payload.title,
            message=payload.message,
            type=payload.notification_type,
            roles=target_roles,
            project_id=payload.project_id,
            action_path=payload.action_path,
            action_label=payload.action_label
        )
        return make_success_response({"message": "Action notification generated successfully"})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
