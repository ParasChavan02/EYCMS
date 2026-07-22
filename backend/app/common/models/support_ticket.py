from typing import TYPE_CHECKING, List
from datetime import datetime
import uuid
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User
    from app.common.models.support_ticket_message import SupportTicketMessage

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    issue: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(50), default="OPEN")
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    assigned_to_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    screenshot_path: Mapped[str] = mapped_column(String(512), nullable=True)
    admin_notes: Mapped[str] = mapped_column(Text, nullable=True)
    estimated_resolution_time: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator: Mapped["User"] = relationship(foreign_keys=[created_by_id], back_populates="support_tickets")
    assigned_to: Mapped["User"] = relationship(foreign_keys=[assigned_to_id])
    messages: Mapped[List["SupportTicketMessage"]] = relationship(
        back_populates="ticket", cascade="all, delete-orphan", order_by="SupportTicketMessage.created_at.asc()"
    )
