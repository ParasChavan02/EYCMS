from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ---------- Spending categories ----------

class BudgetSpendingCreate(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=150)
    amount: float = Field(..., ge=0)
    remarks: Optional[str] = None


class BudgetSpendingUpdate(BaseModel):
    category_name: Optional[str] = Field(None, min_length=1, max_length=150)
    amount: Optional[float] = Field(None, ge=0)
    remarks: Optional[str] = None


class BudgetSpendingItem(BaseModel):
    id: str
    category_name: str
    amount: float
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------- Allocation ----------

class BudgetAllocationCreate(BaseModel):
    allocated_amount: float = Field(..., ge=0)
    financial_year: str = Field(..., min_length=1, max_length=20)
    remarks: Optional[str] = None


class BudgetAllocationUpdate(BaseModel):
    allocated_amount: Optional[float] = Field(None, ge=0)
    financial_year: Optional[str] = Field(None, min_length=1, max_length=20)
    remarks: Optional[str] = None


class BudgetAllocationHistoryItem(BaseModel):
    id: str
    financial_year: str
    allocated_amount: float
    remarks: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------- User budget summary / detail ----------

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
    utilization_status: str = "NOT_UTILIZED"  # NOT_UTILIZED | LOW | MEDIUM | HIGH | EXCEEDED
    category_count: int = 0


class UserBudgetDetail(UserBudgetSummary):
    spending: List[BudgetSpendingItem] = []
    allocation_history: List[BudgetAllocationHistoryItem] = []


# ---------- Team-level summary ----------

class TeamBudgetSummary(BaseModel):
    team_id: Optional[str] = None
    team_name: str
    total_allocated: float = 0
    total_utilized: float = 0
    total_remaining: float = 0
    utilization_percent: float = 0
    member_count: int = 0
    members: List[UserBudgetSummary] = []


# ---------- Overall summary ----------

class BudgetHeadsOverallSummary(BaseModel):
    total_allocated: float = 0
    total_utilized: float = 0
    total_remaining: float = 0
    utilization_percent: float = 0
    total_users: int = 0
    total_teams: int = 0


class BudgetHeadsOverview(BaseModel):
    summary: BudgetHeadsOverallSummary
    teams: List[TeamBudgetSummary]