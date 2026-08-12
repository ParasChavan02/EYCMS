from typing import TYPE_CHECKING, Optional
from datetime import date, datetime, time
import uuid
from sqlalchemy import String, ForeignKey, Date, Time, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.project import Project
    from app.common.models.user import User

class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    event_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column("type", String(100), nullable=False)
    event_date: Mapped[date] = mapped_column("date", Date, nullable=False, index=True)
    event_time: Mapped[time] = mapped_column("time", Time, nullable=False)
    venue: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    coordinator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    coordinator: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="UPCOMING", index=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column("created_by", ForeignKey("users.id"), nullable=False, index=True)
    legacy_event_date: Mapped[datetime] = mapped_column("event_date", DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    cancelled_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        "cancelled_by", ForeignKey("users.id"), nullable=True
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship(lazy="joined")
    coordinator_user: Mapped["User"] = relationship(foreign_keys=[coordinator_id], lazy="joined")
    created_by_user: Mapped["User"] = relationship(foreign_keys=[created_by_id], lazy="joined")
    cancelled_by_user: Mapped[Optional["User"]] = relationship(foreign_keys=[cancelled_by_id], lazy="joined")
