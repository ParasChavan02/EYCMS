from typing import TYPE_CHECKING, List
from datetime import datetime
import uuid
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.role import Role
    from app.common.models.admin_token import AdminToken
    from app.common.models.transaction import Transaction
    from app.common.models.uc import UtilizationCertificate
    from app.common.models.event import Event
    from app.common.models.report import Report
    from app.common.models.support import SupportTicket
    from app.common.models.audit import AuditLog
    from app.common.models.notification import Notification

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    role: Mapped["Role"] = relationship(back_populates="users")
    created_tokens: Mapped[List["AdminToken"]] = relationship(back_populates="creator")
    
    # Transactions created by user, and transactions verified/approved by user
    created_transactions: Mapped[List["Transaction"]] = relationship(
        foreign_keys="[Transaction.created_by_id]", back_populates="creator"
    )
    verified_transactions: Mapped[List["Transaction"]] = relationship(
        foreign_keys="[Transaction.verified_by_id]", back_populates="verifier"
    )
    approved_transactions: Mapped[List["Transaction"]] = relationship(
        foreign_keys="[Transaction.approved_by_id]", back_populates="approver"
    )
    
    # Utilization Certificates
    requested_ucs: Mapped[List["UtilizationCertificate"]] = relationship(
        foreign_keys="[UtilizationCertificate.requested_by_id]", back_populates="requester"
    )
    verified_ucs: Mapped[List["UtilizationCertificate"]] = relationship(
        foreign_keys="[UtilizationCertificate.verified_by_id]", back_populates="verifier"
    )
    approved_ucs: Mapped[List["UtilizationCertificate"]] = relationship(
        foreign_keys="[UtilizationCertificate.approved_by_id]", back_populates="approver"
    )
    
    coordinated_events: Mapped[List["Event"]] = relationship(back_populates="coordinator")
    submitted_reports: Mapped[List["Report"]] = relationship(back_populates="submitter")
    support_tickets: Mapped[List["SupportTicket"]] = relationship(back_populates="creator")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user")
