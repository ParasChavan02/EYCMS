from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ==========================================
# TRANSACTION SCHEMAS
# ==========================================

class AdminTransactionDashboardCounters(BaseModel):
    pending_review: int = 0
    approved: int = 0
    admin_recorded: int = 0
    awaiting_reconciliation: int = 0
    reconciled: int = 0
    rejected: int = 0
    historical: int = 0
    locked: int = 0

class AdminTransactionItem(BaseModel):
    id: str
    date: datetime
    description: str
    vendor: Optional[str] = None
    grant: Optional[str] = None
    grant_id: Optional[str] = None
    budget_line: str = "Travel"
    budget_head: str = "Travel"
    amount: float
    source: str
    bill_id: Optional[str] = None
    bill_filename: Optional[str] = None
    bill_url: Optional[str] = None
    status: str
    reconciliation_status: str
    reference_number: Optional[str] = None
    created_by_name: str
    created_by_email: Optional[str] = None
    created_at: Optional[datetime] = None
    is_historical: bool = False
    bank_transaction_id: Optional[str] = None
    reconciled_at: Optional[datetime] = None
    match_type: Optional[str] = None

class AdminBillUploadIn(BaseModel):
    amount: float
    budget_line: str
    vendor: str
    grant_id: Optional[str] = None
    description: str

class TransactionCsvRowError(BaseModel):
    row: int
    field: str
    reason: str

class AdminTransactionStagedRow(BaseModel):
    row_index: int
    date: str
    description: str
    budget_head: str = "Travel"
    budget_line: str = "Travel"
    amount: float
    reference_number: Optional[str] = None
    is_valid: bool = True

class TransactionCsvStageResponse(BaseModel):
    total_rows: int
    valid_count: int
    invalid_count: int
    duplicate_count: int
    errors: List[TransactionCsvRowError]
    preview_rows: List[dict]
    stage_token: str

AdminTransactionStageResponse = TransactionCsvStageResponse

class TransactionCsvConfirmIn(BaseModel):
    stage_token: str
    is_historical: bool = False

AdminTransactionConfirmIn = TransactionCsvConfirmIn

# ==========================================
# RECONCILIATION SCHEMAS
# ==========================================

class ReconciliationSummaryKPIs(BaseModel):
    imported: int = 0
    awaiting_reconciliation: int = 0
    auto_matched: int = 0
    manually_matched: int = 0
    unmatched: int = 0
    variances: int = 0
    journal_entries: int = 0
    confirmed: int = 0
    locked: int = 0
    journal_threshold: float = 10000.0

class BankStatementStageResponse(BaseModel):
    total_rows: int
    total_credits: float
    total_debits: float
    duplicate_rows: int
    invalid_rows: int
    date_range: str
    errors: List[TransactionCsvRowError]
    preview_rows: List[dict]
    stage_token: str

class BankStatementConfirmIn(BaseModel):
    stage_token: str
    period_name: Optional[str] = None

class BankTransactionItem(BaseModel):
    id: str
    bank_txn_id: str
    date: datetime
    description: str
    reference_number: Optional[str] = None
    debit: float
    credit: float
    amount: float
    match_status: str
    match_confidence: Optional[str] = None
    match_type: Optional[str] = None
    match_reason: Optional[str] = None
    matched_transaction_id: Optional[str] = None
    matched_transaction_desc: Optional[str] = None
    matched_bill_id: Optional[str] = None
    matched_bill_url: Optional[str] = None
    period_id: Optional[str] = None
    notes: Optional[str] = None

class AutoMatchRequest(BaseModel):
    period_name: Optional[str] = None

class AutoMatchResultItem(BaseModel):
    bank_txn_id: str
    matched_txn_id: Optional[str]
    match_status: str
    match_confidence: str
    match_type: str
    match_reason: str

class AutoMatchResponse(BaseModel):
    success: bool
    matched_count: int
    unmatched_count: int
    matches: List[AutoMatchResultItem]

class ManualMatchRequest(BaseModel):
    bank_transaction_id: str
    transaction_id: str
    notes: Optional[str] = None

class UnmatchRequest(BaseModel):
    bank_transaction_id: str
    notes: Optional[str] = None

class JournalEntryRequest(BaseModel):
    bank_transaction_id: str
    debit_account: str  # Expense head name
    credit_account: str # Bank or cash account
    amount: float
    narration: str

class ConfirmPeriodRequest(BaseModel):
    period_name: str
    notes: Optional[str] = None

class LockPeriodRequest(BaseModel):
    period_name: str
    notes: Optional[str] = None

class UnlockPeriodRequest(BaseModel):
    period_name: str
    reason: str
