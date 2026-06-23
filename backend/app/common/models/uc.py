from typing import TYPE_CHECKING, List
from datetime import datetime
import uuid
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User

class UtilizationCertificate(Base):
    __tablename__ = "utilization_certificates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    requested_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="REQUESTED", index=True)
    template_file: Mapped[str] = mapped_column(String(255), nullable=True)
    template_instructions: Mapped[str] = mapped_column(Text, nullable=True)
    uploaded_uc_file: Mapped[str] = mapped_column(String(255), nullable=True)
    finance_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    admin_remarks: Mapped[str] = mapped_column(Text, nullable=True)
    verified_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    requester: Mapped["User"] = relationship(
        foreign_keys=[requested_by_id], back_populates="requested_ucs"
    )
    verifier: Mapped["User"] = relationship(
        foreign_keys=[verified_by_id], back_populates="verified_ucs"
    )
    approver: Mapped["User"] = relationship(
        foreign_keys=[approved_by_id], back_populates="approved_ucs"
    )
    
    attachments: Mapped[List["UCAttachment"]] = relationship(
        back_populates="uc", cascade="all, delete-orphan"
    )


class UCAttachment(Base):
    __tablename__ = "uc_attachments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    uc_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("utilization_certificates.id", ondelete="CASCADE"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    uc: Mapped["UtilizationCertificate"] = relationship(back_populates="attachments")
