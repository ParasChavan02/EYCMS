from typing import TYPE_CHECKING, List
from datetime import datetime, date
import uuid
from sqlalchemy import String, Date, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.user import User
    from app.common.models.budget import Budget
    from app.common.models.event import Event
    from app.common.models.report import QuarterlyReport
    from app.common.models.utilization_certificate import UCRequest
    from app.common.models.team import Team

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    mentor_name: Mapped[str] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    duration: Mapped[int] = mapped_column(nullable=False)  # Duration in months/days
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(back_populates="project")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    events: Mapped[List["Event"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    reports: Mapped[List["QuarterlyReport"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    uc_requests: Mapped[List["UCRequest"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    teams: Mapped[List["Team"]] = relationship(back_populates="project", cascade="all, delete-orphan")
