from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ---------- Unified Budget Allocation ----------

class EYCAllocationCreate(BaseModel):
    section: str = Field(..., description="COMMON, MAIN, FELLOWS, or SHARED")
    budget_head: str = Field(..., min_length=1, max_length=100)
    project_uuid: Optional[str] = None
    allocated_amount: float = Field(..., ge=0)
    financial_year: str = Field(..., min_length=1, max_length=20)
    remarks: Optional[str] = None


# ---------- Budget Head / Item details ----------

class EYCBudgetHeadItem(BaseModel):
    id: Optional[str] = None
    name: str
    allocated: float = 0.0
    utilized: float = 0.0
    remaining: float = 0.0
    unallocated: float = 0.0
    financial_year: Optional[str] = None
    remarks: Optional[str] = None
    allocations: List[dict] = []
    transactions: List[dict] = []


class EYCBudgetSectionDetail(BaseModel):
    total: float = 0.0
    allocated: float = 0.0
    utilized: float = 0.0
    remaining: float = 0.0
    unallocated: float = 0.0
    heads: Optional[List[EYCBudgetHeadItem]] = None
    allocations: Optional[List[dict]] = None
    projects: Optional[List[dict]] = None
    transactions: Optional[List[dict]] = None


class EYCThreeLevelBudgetOverview(BaseModel):
    common_budget: EYCBudgetSectionDetail
    centre_budget: EYCBudgetSectionDetail
    fellows_budget: EYCBudgetSectionDetail
    analytics: Optional[dict] = None


# ---------- Legacy Stubs (to prevent import errors) ----------

class BudgetSpendingCreate(BaseModel):
    category_name: str
    amount: float
    remarks: Optional[str] = None

class BudgetSpendingUpdate(BaseModel):
    category_name: Optional[str] = None
    amount: Optional[float] = None
    remarks: Optional[str] = None

class BudgetSpendingItem(BaseModel):
    id: str
    category_name: str
    amount: float
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class BudgetAllocationCreate(BaseModel):
    allocated_amount: float
    financial_year: str
    remarks: Optional[str] = None

class BudgetAllocationUpdate(BaseModel):
    allocated_amount: Optional[float] = None
    financial_year: Optional[str] = None
    remarks: Optional[str] = None

class UserBudgetSummary(BaseModel):
    user_id: str
    user_name: str
    email: str
    role: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    allocation_id: Optional[str] = None
    financial_year: Optional[str] = None
    allocated_amount: float = 0
    utilized_amount: float = 0
    remaining_amount: float = 0
    utilization_percent: float = 0
    utilization_status: str = "NOT_UTILIZED"
    category_count: int = 0

class UserBudgetDetail(UserBudgetSummary):
    spending: List[BudgetSpendingItem] = []
    allocation_history: List[dict] = []

class BudgetHeadsOverview(BaseModel):
    summary: dict
    teams: List[dict]

class BudgetAllocationHistoryItem(BaseModel):
    id: str
    financial_year: str
    allocated_amount: float
    remarks: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TeamBudgetSummary(BaseModel):
    team_id: Optional[str] = None
    team_name: str
    total_allocated: float = 0
    total_utilized: float = 0
    total_remaining: float = 0
    utilization_percent: float = 0
    member_count: int = 0
    members: List[dict] = []

class BudgetHeadsOverallSummary(BaseModel):
    total_allocated: float = 0
    total_utilized: float = 0
    total_remaining: float = 0
    utilization_percent: float = 0
    total_users: int = 0
    total_teams: int = 0

class EYCSuperAdminOverview(BaseModel):
    total_common_budget: float
    total_allocated: float
    available_balance: float
    centre_allocation: float
    fellows_allocation: float
    utilization: float
    allocation_history: List[dict] = []
    common_history: List[dict] = []