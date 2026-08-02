from typing import TYPE_CHECKING
from datetime import datetime
import uuid
from decimal import Decimal
from sqlalchemy import String, ForeignKey, DateTime, Numeric, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.project import Project
    from app.common.models.user import User
    from app.common.models.uc_template import UCTemplate
    from app.common.models.uc_submission import UCSubmission
    from app.common.models.project_file import ProjectFile

class UCRequest(Base):
    __tablename__ = "uc_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    requested_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="uc_requests")
    requester: Mapped["User"] = relationship(back_populates="requested_ucs")
    
    template: Mapped["UCTemplate"] = relationship(back_populates="uc_request", uselist=False, cascade="all, delete-orphan")
    submission: Mapped["UCSubmission"] = relationship(back_populates="uc_request", uselist=False, cascade="all, delete-orphan")


class UtilizationCertificate(Base):
    __tablename__ = "utilization_certificates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("project_files.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reporting_period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="PENDING_REVIEW", index=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project: Mapped["Project"] = relationship("Project")
    uploaded_file: Mapped["ProjectFile"] = relationship("ProjectFile")
    uploader: Mapped["User"] = relationship("User")
