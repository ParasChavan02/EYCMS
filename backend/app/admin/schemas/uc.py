from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class UCFinancialSummaryIn(BaseModel):
    opening_balance: Decimal = Field(default=0)
    grant_received: Decimal = Field(default=0)
    interest_earned: Decimal = Field(default=0)
    other_receipts: Decimal = Field(default=0)
    total_available_funds: Decimal = Field(default=0)
    actual_expenditure: Decimal = Field(default=0)
    refunded_amount: Decimal = Field(default=0)
    closing_balance: Decimal = Field(default=0)
    amount_carried_forward: Decimal = Field(default=0)


class UCStatementOfExpenditureRowIn(BaseModel):
    head: str
    opening_balance: Decimal = Field(default=0)
    grant_received: Decimal = Field(default=0)
    total_available: Decimal = Field(default=0)
    actual_expenditure: Decimal = Field(default=0)
    balance: Decimal = Field(default=0)
    remarks: Optional[str] = None
    sort_order: int = 0


class UCCommittedExpenditureRowIn(BaseModel):
    head_of_expenditure: str
    particulars: str
    tentative_amount: Decimal = Field(default=0)
    contribution: Decimal = Field(default=0)
    expected_expenditure_date: Optional[date] = None
    sort_order: int = 0


class UCCapitalAssetIn(BaseModel):
    item: str
    budget_cost: Decimal = Field(default=0)
    actual_cost: Decimal = Field(default=0)
    contribution: Decimal = Field(default=0)
    procurement_date: Optional[date] = None
    insurance_period: Optional[str] = None
    insurance_amount: Decimal = Field(default=0)
    beneficiary: Optional[str] = None
    sort_order: int = 0


class UCManpowerDetailIn(BaseModel):
    employee_name: str
    qualification: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    salary_period: Optional[str] = None
    monthly_salary: Decimal = Field(default=0)
    total_paid: Decimal = Field(default=0)
    sort_order: int = 0


class UCRecordBase(BaseModel):
    project_id: Optional[str] = None
    reference_no: str
    project_title: str
    organization: str
    project_coordinator: str
    sanction_order_no: str
    project_start_date: Optional[date] = None
    project_end_date: Optional[date] = None
    bank_account_number: str
    financial_year: str
    reporting_period_from: Optional[date] = None
    reporting_period_to: Optional[date] = None
    financial_summary: UCFinancialSummaryIn
    soe_rows: List[UCStatementOfExpenditureRowIn] = Field(default_factory=list)
    committed_rows: List[UCCommittedExpenditureRowIn] = Field(default_factory=list)
    capital_assets: List[UCCapitalAssetIn] = Field(default_factory=list)
    manpower_details: List[UCManpowerDetailIn] = Field(default_factory=list)
    notes: Optional[str] = None


class UCRecordCreate(UCRecordBase):
    pass


class UCRecordUpdate(BaseModel):
    project_id: Optional[str] = None
    reference_no: Optional[str] = None
    project_title: Optional[str] = None
    organization: Optional[str] = None
    project_coordinator: Optional[str] = None
    sanction_order_no: Optional[str] = None
    project_start_date: Optional[date] = None
    project_end_date: Optional[date] = None
    bank_account_number: Optional[str] = None
    financial_year: Optional[str] = None
    reporting_period_from: Optional[date] = None
    reporting_period_to: Optional[date] = None
    financial_summary: Optional[UCFinancialSummaryIn] = None
    soe_rows: Optional[List[UCStatementOfExpenditureRowIn]] = None
    committed_rows: Optional[List[UCCommittedExpenditureRowIn]] = None
    capital_assets: Optional[List[UCCapitalAssetIn]] = None
    manpower_details: Optional[List[UCManpowerDetailIn]] = None
    notes: Optional[str] = None
    change_note: Optional[str] = None


class UCSupportingDocumentUploadResponse(BaseModel):
    id: str
    uc_record_id: str
    file_name: str
    original_file_name: str
    file_path: str
    document_type: str
    file_size: int
    created_at: datetime


class UCVersionHistoryResponse(BaseModel):
    id: str
    version_number: int
    change_note: Optional[str] = None
    created_at: datetime
    changed_by_name: Optional[str] = None


class UCRecordResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    reference_no: str
    project_title: str
    organization: str
    project_coordinator: str
    sanction_order_no: str
    project_start_date: Optional[date] = None
    project_end_date: Optional[date] = None
    bank_account_number: str
    financial_year: str
    reporting_period_from: Optional[date] = None
    reporting_period_to: Optional[date] = None
    status: str
    version: int
    generated_pdf_file_name: Optional[str] = None
    generated_pdf_path: Optional[str] = None
    notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    financial_summary: UCFinancialSummaryIn
    soe_rows: List[UCStatementOfExpenditureRowIn] = Field(default_factory=list)
    committed_rows: List[UCCommittedExpenditureRowIn] = Field(default_factory=list)
    capital_assets: List[UCCapitalAssetIn] = Field(default_factory=list)
    manpower_details: List[UCManpowerDetailIn] = Field(default_factory=list)
    supporting_documents: List[UCSupportingDocumentUploadResponse] = Field(default_factory=list)
    versions: List[UCVersionHistoryResponse] = Field(default_factory=list)
