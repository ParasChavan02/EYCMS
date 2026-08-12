from typing import TYPE_CHECKING, List, Optional
from datetime import datetime, date
import uuid
from sqlalchemy import String, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User
    from app.common.models.bank_transaction import BankTransaction

class ReconciliationPeriod(Base):
    __tablename__ = "reconciliation_periods"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    period_name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Status: OPEN, AWAITING_CONFIRMATION, CONFIRMED, LOCKED
    status: Mapped[str] = mapped_column(String(50), default="OPEN", index=True)

    confirmed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    locked_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    locked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    unlock_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unlocked_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    unlocked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    confirmed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[confirmed_by_id])
    locked_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[locked_by_id])
    unlocked_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[unlocked_by_id])
    bank_transactions: Mapped[List["BankTransaction"]] = relationship("BankTransaction", back_populates="period")
