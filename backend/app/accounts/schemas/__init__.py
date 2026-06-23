from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AccountsDashboardKPIs(BaseModel):
    total_ledger_amount: float
    reconciled_transactions: int
    pending_verifications: int
    budget_utilized_percent: float

class LedgerEntry(BaseModel):
    transaction_id: str
    amount: float
    budget_head: str
    description: str
    status: str
    created_at: datetime

class StatementReconciliationPayload(BaseModel):
    statement_file_name: str
    reconciliation_notes: Optional[str] = None
