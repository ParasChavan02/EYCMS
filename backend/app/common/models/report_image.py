from typing import TYPE_CHECKING
from datetime import datetime
import uuid
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

if TYPE_CHECKING:
    from app.common.models.report import QuarterlyReport

class ReportImage(Base):
    __tablename__ = "report_images"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quarterly_reports.id", ondelete="CASCADE"), nullable=False)
    image_name: Mapped[str] = mapped_column(String(255), nullable=False)
    image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    report: Mapped["QuarterlyReport"] = relationship(back_populates="images")
