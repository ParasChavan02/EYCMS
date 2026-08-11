from typing import TYPE_CHECKING, List
from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Numeric, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User


class UserBudgetAllocation(Base):
    """
    Admin-managed budget allocated to an individual user for a given
    financial year / budget period. A user may have multiple allocations
    across different financial years, but only one ACTIVE allocation per
    financial year is expected (enforced at the service layer, not the DB,
    to keep this additive to the existing schema).
    """
    __tablename__ = "user_budget_allocations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(20), nullable=False)
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="budget_allocations", foreign_keys=[user_id])
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])
    spending_entries: Mapped[List["UserBudgetSpending"]] = relationship(
        back_populates="allocation", cascade="all, delete-orphan"
    )


class UserBudgetSpending(Base):
    """
    A single custom spending category / utilization entry recorded by the
    Admin against a user's budget allocation. `category_name` is free-text
    so different users/teams can define their own categories.
    """
    __tablename__ = "user_budget_spending"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    allocation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_budget_allocations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_name: Mapped[str] = mapped_column(String(150), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    allocation: Mapped["UserBudgetAllocation"] = relationship(back_populates="spending_entries")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    created_by: Mapped["User"] = relationship(foreign_keys=[created_by_id])