from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List
import uuid

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.project import Project
    from app.common.models.user import User


class UCRecord(Base):
    __tablename__ = "uc_records"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    reference_no: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    project_title: Mapped[str] = mapped_column(String(255), nullable=False)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    project_coordinator: Mapped[str] = mapped_column(String(255), nullable=False)
    sanction_order_no: Mapped[str] = mapped_column(String(120), nullable=False)
    project_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    project_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    bank_account_number: Mapped[str] = mapped_column(String(64), nullable=False)
    financial_year: Mapped[str] = mapped_column(String(32), nullable=False)
    reporting_period_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    reporting_period_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    generated_pdf_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    generated_pdf_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by_id], lazy="joined")
    updater: Mapped["User"] = relationship("User", foreign_keys=[updated_by_id], lazy="joined")
    submitter: Mapped["User"] = relationship("User", foreign_keys=[submitted_by_id], lazy="joined")
    financial_summary: Mapped["UCFinancialSummary"] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", uselist=False
    )
    soe_rows: Mapped[List["UCStatementOfExpenditureRow"]] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", order_by="UCStatementOfExpenditureRow.sort_order"
    )
    committed_rows: Mapped[List["UCCommittedExpenditureRow"]] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", order_by="UCCommittedExpenditureRow.sort_order"
    )
    capital_assets: Mapped[List["UCCapitalAsset"]] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", order_by="UCCapitalAsset.sort_order"
    )
    manpower_details: Mapped[List["UCManpowerDetail"]] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", order_by="UCManpowerDetail.sort_order"
    )
    supporting_documents: Mapped[List["UCSupportingDocument"]] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", order_by="UCSupportingDocument.created_at"
    )
    versions: Mapped[List["UCVersionHistory"]] = relationship(
        back_populates="uc_record", cascade="all, delete-orphan", order_by="UCVersionHistory.version_number.desc()"
    )


class UCFinancialSummary(Base):
    __tablename__ = "uc_financial_summaries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), unique=True, nullable=False)
    opening_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    grant_received: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    interest_earned: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    other_receipts: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    total_available_funds: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    actual_expenditure: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    refunded_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    closing_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    amount_carried_forward: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)

    uc_record: Mapped["UCRecord"] = relationship(back_populates="financial_summary")


class UCStatementOfExpenditureRow(Base):
    __tablename__ = "uc_soe_rows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), nullable=False)
    head: Mapped[str] = mapped_column(String(255), nullable=False)
    opening_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    grant_received: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    total_available: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    actual_expenditure: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    uc_record: Mapped["UCRecord"] = relationship(back_populates="soe_rows")


class UCCommittedExpenditureRow(Base):
    __tablename__ = "uc_committed_rows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), nullable=False)
    head_of_expenditure: Mapped[str] = mapped_column(String(255), nullable=False)
    particulars: Mapped[str] = mapped_column(Text, nullable=False)
    tentative_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    contribution: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    expected_expenditure_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    uc_record: Mapped["UCRecord"] = relationship(back_populates="committed_rows")


class UCCapitalAsset(Base):
    __tablename__ = "uc_capital_assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), nullable=False)
    item: Mapped[str] = mapped_column(String(255), nullable=False)
    budget_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    actual_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    contribution: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    procurement_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    insurance_period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    beneficiary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    uc_record: Mapped["UCRecord"] = relationship(back_populates="capital_assets")


class UCManpowerDetail(Base):
    __tablename__ = "uc_manpower_details"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), nullable=False)
    employee_name: Mapped[str] = mapped_column(String(255), nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    salary_period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    monthly_salary: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    total_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    uc_record: Mapped["UCRecord"] = relationship(back_populates="manpower_details")


class UCSupportingDocument(Base):
    __tablename__ = "uc_supporting_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    document_type: Mapped[str] = mapped_column(String(80), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    uc_record: Mapped["UCRecord"] = relationship(back_populates="supporting_documents")
    uploader: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by_id], lazy="joined")


class UCVersionHistory(Base):
    __tablename__ = "uc_version_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("uc_records.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    change_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    uc_record: Mapped["UCRecord"] = relationship(back_populates="versions")
    changer: Mapped["User"] = relationship("User", foreign_keys=[changed_by_id], lazy="joined")
