from typing import TYPE_CHECKING, Optional
from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import String, ForeignKey, DateTime, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User
    from app.common.models.transaction import Transaction
    from app.common.models.reconciliation_period import ReconciliationPeriod

class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    bank_txn_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    debit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    credit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Match Status: UNMATCHED, AUTO_MATCHED, MANUALLY_MATCHED, JOURNAL_ENTRY, CONFIRMED, LOCKED
    match_status: Mapped[str] = mapped_column(String(50), default="UNMATCHED", index=True)
    # Match Confidence: EXACT_MATCH, HIGH_CONFIDENCE, PARTIAL_MATCH, MISMATCH, UNMATCHED
    match_confidence: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Match Type: PRIORITY_1_APPROVAL_BILL, PRIORITY_2_GENERAL_LEDGER, MANUAL, JOURNAL_ENTRY
    match_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    match_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    matched_transaction_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    period_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("reconciliation_periods.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    imported_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    import_batch_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    matched_transaction: Mapped[Optional["Transaction"]] = relationship("Transaction", foreign_keys=[matched_transaction_id])
    period: Mapped[Optional["ReconciliationPeriod"]] = relationship("ReconciliationPeriod", back_populates="bank_transactions")
    imported_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[imported_by_id])
