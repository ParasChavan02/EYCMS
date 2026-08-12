from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class AccountsDashboardKPIs(BaseModel):
    """
    Organization-wide financial snapshot for the read-only Accounts role.
    Derived from the real Budget / Transaction tables (no mock data).
    """
    total_allocated_funds: float
    total_spent_funds: float
    remaining_funds: float
    budget_utilized_percent: float
    pending_transactions: int
    active_budgets: int


class AccountsTransactionItem(BaseModel):
    id: str
    date: datetime
    description: str
    budget_head: str
    project_title: Optional[str] = None
    amount: float
    status: str
    created_by_name: Optional[str] = None


class AccountsBudgetHeadItem(BaseModel):
    id: str
    name: str
    allocated: float
    utilized: float
    remaining: float
    utilization_percent: float


class AccountsBudgetItem(BaseModel):
    id: str
    project_id: Optional[str] = None
    project_title: Optional[str] = None
    financial_year: str
    status: str
    total_allocated: float
    total_utilized: float
    total_remaining: float
    utilization_percent: float
    budget_heads: List[AccountsBudgetHeadItem]
