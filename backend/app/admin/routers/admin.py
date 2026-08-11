from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.dependencies import get_db, verify_admin, require_admin_only
from app.common.models.user import User
from app.admin.schemas import (
    AdminDashboardKPIs,
    UserProgressMonitoring,
    UserProgressDetail,
    AdminCreateTransaction,
    AdminTransactionReview,
    AdminTransactionItem,
    AdminTransactionImportResponse,
)
from app.support.schemas import (
    SupportTicketResponse,
    SupportTicketAssign,
    SupportTicketStatusUpdate,
    SupportTicketNotesUpdate,
    SupportTicketEscalate,
    SupportTicketMessageResponse,
    SupportTicketMessageCreate
)
from app.notifications.schemas import (
    NotificationBroadcast
)
from app.admin.services import AdminService
from app.admin.services.dashboard_service import AdminDashboardService
from app.support.services import SupportService
from app.notifications.services.notification_service import NotificationService
from app.admin.services.transactions import AdminTransactionCsvService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/admin", tags=["Admin Operations"], dependencies=[Depends(verify_admin)])

@router.get("/dashboard", response_model=ResponseEnvelope[AdminDashboardKPIs])
def get_dashboard_kpis(db: Session = Depends(get_db)):
    try:
        kpis = AdminDashboardService.get_dashboard_kpis(db)
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

@router.get("/budget-heads", response_model=ResponseEnvelope[List[str]])
def list_budget_heads(db: Session = Depends(get_db), current_admin: User = Depends(verify_admin)):
    try:
        budget_heads = AdminService.get_budget_heads(db)
        return make_success_response(budget_heads)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/transactions", response_model=ResponseEnvelope[List[AdminTransactionItem]])
def list_transactions(
    search: Optional[str] = Query(None, alias="search"),
    status_filter: Optional[str] = Query(None, alias="status"),
    budget_head: Optional[str] = Query(None, alias="budget_head"),
    date_from: Optional[str] = Query(None, alias="date_from"),
    date_to: Optional[str] = Query(None, alias="date_to"),
    created_by: Optional[str] = Query(None, alias="created_by"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only)
):
    try:
        parsed_date_from = datetime.fromisoformat(date_from) if date_from else None
        parsed_date_to = datetime.fromisoformat(date_to) if date_to else None
        transactions = AdminTransactionCsvService.list_transactions(
            db=db,
            search=search,
            status_filter=status_filter,
            budget_head=budget_head,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            created_by=created_by,
        )
        return make_success_response(transactions)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/transactions/import", response_model=ResponseEnvelope[AdminTransactionImportResponse])
async def import_transactions(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only)
):
    try:
        file_bytes = await file.read()
        result = AdminTransactionCsvService.import_transactions(
            db=db,
            file_bytes=file_bytes,
            filename=file.filename or "transactions.csv",
            current_admin=current_admin,
            ip_address=request.client.host if request.client else None,
        )
        return make_success_response(result)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/transactions/export")
def export_transactions(
    request: Request,
    search: Optional[str] = Query(None, alias="search"),
    status_filter: Optional[str] = Query(None, alias="status"),
    budget_head: Optional[str] = Query(None, alias="budget_head"),
    date_from: Optional[str] = Query(None, alias="date_from"),
    date_to: Optional[str] = Query(None, alias="date_to"),
    created_by: Optional[str] = Query(None, alias="created_by"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only)
):
    try:
        parsed_date_from = datetime.fromisoformat(date_from) if date_from else None
        parsed_date_to = datetime.fromisoformat(date_to) if date_to else None
        csv_content = AdminTransactionCsvService.export_transactions(
            db=db,
            search=search,
            status_filter=status_filter,
            budget_head=budget_head,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            created_by=created_by,
            current_admin=current_admin,
            ip_address=request.client.host if request and request.client else None,
        )
        export_name = f"transactions_{datetime.now().date().isoformat()}.csv"
        return StreamingResponse(
            iter([csv_content.encode("utf-8")]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{export_name}"'},
        )
    except HTTPException as he:
        raise he
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

# ============ SUPPORT DESK (ADMIN OPERATIONS) ============

@router.get("/support/tickets", response_model=ResponseEnvelope[List[SupportTicketResponse]])
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    category_filter: Optional[str] = Query(None, alias="category"),
    search_query: Optional[str] = Query(None, alias="search"),
    db: Session = Depends(get_db)
):
    try:
        tickets = SupportService.list_all_tickets(
            db=db,
            status_filter=status_filter,
            priority_filter=priority_filter,
            category_filter=category_filter,
            search_query=search_query
        )
        return make_success_response(tickets)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/support/tickets/{ticket_id}", response_model=ResponseEnvelope[SupportTicketResponse])
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    try:
        ticket = SupportService.get_ticket_by_id(db, ticket_id)
        return make_success_response(ticket)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/support/tickets/{ticket_id}/assign", response_model=ResponseEnvelope[SupportTicketResponse])
def assign_ticket(
    ticket_id: str,
    payload: SupportTicketAssign,
    db: Session = Depends(get_db)
):
    try:
        ticket = SupportService.assign_ticket(db, ticket_id, payload.admin_id)
        return make_success_response(ticket)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/support/tickets/{ticket_id}/status", response_model=ResponseEnvelope[SupportTicketResponse])
def update_status(
    ticket_id: str,
    payload: SupportTicketStatusUpdate,
    db: Session = Depends(get_db)
):
    try:
        ticket = SupportService.update_status(db, ticket_id, payload.status)
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
    current_admin: User = Depends(verify_admin)
):
    try:
        msg = SupportService.add_message(
            db=db,
            ticket_id=ticket_id,
            message=payload.message,
            attachments=payload.attachments,
            is_admin_reply=True,
            sender_id=str(current_admin.id)
        )
        return make_success_response(msg)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/support/tickets/{ticket_id}/notes", response_model=ResponseEnvelope[SupportTicketResponse])
def update_notes(
    ticket_id: str,
    payload: SupportTicketNotesUpdate,
    db: Session = Depends(get_db)
):
    try:
        ticket = SupportService.update_notes(db, ticket_id, payload.notes)
        return make_success_response(ticket)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/support/tickets/{ticket_id}/escalate", response_model=ResponseEnvelope[SupportTicketResponse])
def escalate_ticket(
    ticket_id: str,
    payload: SupportTicketEscalate,
    db: Session = Depends(get_db)
):
    try:
        ticket = SupportService.escalate_ticket(db, ticket_id, payload.reason)
        return make_success_response(ticket)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ============ ADMIN ANNOUNCEMENT BROADCASTING ============

@router.post("/notifications/broadcast", response_model=ResponseEnvelope[dict])
def broadcast_announcement(
    payload: NotificationBroadcast,
    db: Session = Depends(get_db)
):
    try:
        NotificationService.broadcast_notification(
            db=db,
            title=payload.title,
            message=payload.message,
            type=payload.type,
            roles=payload.roles,
            project_id=payload.project_id,
            action_path=payload.action_path,
            action_label=payload.action_label
        )
        return make_success_response({"message": "Announcement broadcasted successfully to all target users"})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============ ADMIN USERS & ONBOARDING OPERATIONS ============
from pydantic import BaseModel
from app.admin.services.users_service import AdminUsersService

class AdminProjectCreate(BaseModel):
    project_id: str
    title: str

class AdminUserCreate(BaseModel):
    name: str
    email: str
    role: str
    department: Optional[str] = None
    project_id: Optional[str] = None
    team_id: Optional[str] = None
    status: Optional[str] = "Active"
    joining_date: Optional[str] = None
    password: Optional[str] = None
    contact_number: Optional[str] = None

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    project_id: Optional[str] = None
    team_id: Optional[str] = None
    status: Optional[str] = None
    joining_date: Optional[str] = None
    contact_number: Optional[str] = None

class AdminUserResetPassword(BaseModel):
    password: Optional[str] = None

@router.get("/users/stats")
def get_users_stats(db: Session = Depends(get_db)):
    try:
        stats = AdminUsersService.get_users_stats(db)
        return make_success_response(stats)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users/list")
def get_users_list(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    department: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    team_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        users = AdminUsersService.get_users_list(
            db=db,
            search=search,
            role=role,
            status_filter=status_filter,
            department=department,
            project_id=project_id,
            team_id=team_id
        )
        return make_success_response(users)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users/{user_id}", response_model=ResponseEnvelope[UserProgressDetail])
def get_user_progress_detail(user_id: str, db: Session = Depends(get_db)):
    try:
        detail = AdminService.get_user_progress_detail(db, user_id)
        return make_success_response(detail)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/users/create")
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.create_user(db, payload.dict(), str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/users/{user_id}/update")
def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.update_user(db, user_id, payload.dict(exclude_unset=True), str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: str,
    payload: AdminUserResetPassword,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.reset_password(db, user_id, payload.password, str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.toggle_user_status(db, user_id, str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/users/{user_id}/remove-access")
def remove_user_access(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.remove_user_access(db, user_id, str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/projects/list")
def get_projects_list(db: Session = Depends(get_db)):
    try:
        projects = AdminUsersService.get_projects_list(db)
        return make_success_response(projects)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/projects/{project_uuid}/detail")
def get_project_detail(project_uuid: str, db: Session = Depends(get_db)):
    try:
        details = AdminUsersService.get_project_detail(db, project_uuid)
        return make_success_response(details)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/onboarding-requests/list")
def get_onboarding_requests(db: Session = Depends(get_db)):
    try:
        requests = AdminUsersService.get_onboarding_requests(db)
        return make_success_response(requests)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/onboarding-requests/{request_uuid}/approve")
def approve_onboarding_request(
    request_uuid: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.approve_onboarding_request(db, request_uuid, str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/onboarding-requests/{request_uuid}/reject")
def reject_onboarding_request(
    request_uuid: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.reject_onboarding_request(db, request_uuid, str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users/{user_id}/activity")
def get_user_activity(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.get_user_activity(db, user_id)
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/projects/create")
def create_project(
    payload: AdminProjectCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(verify_admin)
):
    try:
        res = AdminUsersService.create_project(db, payload.dict(), str(current_admin.id))
        return make_success_response(res)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
