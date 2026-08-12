from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.admin.schemas.uc import (
    UCCommittedExpenditureRowIn,
    UCCapitalAssetIn,
    UCFinancialSummaryIn,
    UCManpowerDetailIn,
    UCRecordCreate,
    UCRecordResponse,
    UCRecordUpdate,
    UCSupportingDocumentUploadResponse,
    UCVersionHistoryResponse,
)

from app.admin.schemas.budget_heads import (
    BudgetSpendingCreate,
    BudgetSpendingUpdate,
    BudgetSpendingItem,
    BudgetAllocationCreate,
    BudgetAllocationUpdate,
    BudgetAllocationHistoryItem,
    UserBudgetSummary,
    UserBudgetDetail,
    TeamBudgetSummary,
    BudgetHeadsOverallSummary,
    BudgetHeadsOverview,
)

class AdminDashboardKPIs(BaseModel):
    total_active_users: int
    users_near_deadline: int
    pending_reviews: int
    completed_reports: int
    pending_uc_requests: int

class UserProgressMonitoring(BaseModel):
    user_id: str
    user_name: str
    project_id: str
    date_of_joining: datetime
    days_remaining: int
    fellowship_month: int
    program_progress_percent: float
    assigned_events: int
    submitted_reports: int
    uploaded_documents: int
    pending_reviews: int
    current_status: str  # Active, Delayed, Pending Review, Completed

class UserProgressDetail(BaseModel):
    project_id: str
    user_name: str
    email: str
    date_of_joining: datetime
    fellowship_duration_months: int
    days_remaining: int
    current_status: str

class AdminCreateTransaction(BaseModel):
    amount: float
    budget_head: str
    description: str

class AdminTransactionReview(BaseModel):
    transaction_id: str
    action: str  # APPROVE, REJECT, REQUEST_REVISION
    remarks: Optional[str] = None
    is_reconciliation: Optional[bool] = False


class AdminTransactionItem(BaseModel):
    id: str
    budget_head: str
    amount: float
    description: str
    date: datetime
    status: str
    created_by_name: str
    created_by_email: Optional[str] = None
    created_by_role: Optional[str] = None
    source: str
    imported_at: Optional[datetime] = None
    imported_by_name: Optional[str] = None
    imported_by_email: Optional[str] = None
    import_batch_id: Optional[str] = None
    reconciliation_status: Optional[str] = "PENDING"


class AdminTransactionImportError(BaseModel):
    row: int
    reason: str


class AdminTransactionImportResponse(BaseModel):
    success: bool
    imported: int
    skipped: int
    errors: List[AdminTransactionImportError]
    batch_id: Optional[str] = None


__all__ = [
    "AdminDashboardKPIs",
    "UserProgressMonitoring",
    "UserProgressDetail",
    "AdminCreateTransaction",
    "AdminTransactionReview",
    "AdminTransactionItem",
    "AdminTransactionImportError",
    "AdminTransactionImportResponse",
    "UCCommittedExpenditureRowIn",
    "UCCapitalAssetIn",
    "UCFinancialSummaryIn",
    "UCManpowerDetailIn",
    "UCRecordCreate",
    "UCRecordResponse",
    "UCRecordUpdate",
    "UCSupportingDocumentUploadResponse",
    "UCVersionHistoryResponse",
    "BudgetSpendingCreate",
    "BudgetSpendingUpdate",
    "BudgetSpendingItem",
    "BudgetAllocationCreate",
    "BudgetAllocationUpdate",
    "BudgetAllocationHistoryItem",
    "UserBudgetSummary",
    "UserBudgetDetail",
    "TeamBudgetSummary",
    "BudgetHeadsOverallSummary",
    "BudgetHeadsOverview",
]