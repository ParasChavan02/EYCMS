from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
