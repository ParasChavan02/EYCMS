from typing import TYPE_CHECKING, List
from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.budget_head import BudgetHead
    from app.common.models.transaction import Transaction

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    budget_head_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("budget_heads.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    budget_head: Mapped["BudgetHead"] = relationship(back_populates="expenses")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="expense", cascade="all, delete-orphan")
