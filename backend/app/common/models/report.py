from typing import TYPE_CHECKING, List
from datetime import datetime
import uuid
from sqlalchemy import String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User
    from app.common.models.project import Project
    from app.common.models.report_document import ReportDocument
    from app.common.models.report_image import ReportImage
    from app.common.models.milestone import Milestone

class QuarterlyReport(Base):
    __tablename__ = "quarterly_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    submitted_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    quarter_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="reports")
    submitter: Mapped["User"] = relationship(back_populates="submitted_reports")
    
    documents: Mapped[List["ReportDocument"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    images: Mapped[List["ReportImage"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    milestones: Mapped[List["Milestone"]] = relationship(back_populates="report", cascade="all, delete-orphan")
