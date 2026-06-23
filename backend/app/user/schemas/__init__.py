from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FellowDashboardKPIs(BaseModel):
    total_allocated_funds: float
    spent_funds: float
    days_remaining: int
    pending_reimbursements: int

class UCRequestPayload(BaseModel):
    amount: float
    budget_head: str
    remarks: Optional[str] = None

class FellowTransactionItem(BaseModel):
    id: str
    amount: float
    budget_head: str
    description: str
    status: str
    created_at: datetime
