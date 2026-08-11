from typing import TYPE_CHECKING, Optional
from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Numeric, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.project import Project
    from app.common.models.team import Team
    from app.common.models.user import User

class EYCBudgetAllocation(Base):
    __tablename__ = "eyc_budget_allocations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    section: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # MAIN, FELLOWS, SHARED
    budget_head: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    team_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    allocated_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    financial_year: Mapped[str] = mapped_column(String(20), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project")
    team: Mapped[Optional["Team"]] = relationship("Team")
    created_by: Mapped[Optional["User"]] = relationship("User")
