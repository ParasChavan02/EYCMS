from typing import List
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from app.support.schemas import (
    SupportTicketCreate,
    SupportTicketResponse
)

class SupportService:
    """
    Service layer containing core logic for support ticket submission,
    categorization, and support desk dashboards.
    """
    @staticmethod
    def create_ticket(
        db: Session, 
        payload: SupportTicketCreate, 
        user_id: str
    ) -> SupportTicketResponse:
        # Mock support ticket creation
        return SupportTicketResponse(
            id=str(uuid.uuid4()),
            issue=payload.issue,
            category=payload.category,
            priority=payload.priority or "Medium",
            status="OPEN",
            created_at=datetime.now(timezone.utc)
        )

    @staticmethod
    def list_tickets(db: Session, user_id: str) -> List[SupportTicketResponse]:
        # Mock ticket listings
        return [
            SupportTicketResponse(
                id="77777777-7777-7777-7777-777777777777",
                issue="Budget limit error while creating request",
                category="Finance / Transaction",
                priority="HIGH",
                status="OPEN",
                created_at=datetime(2026, 6, 21, 15, 0, 0, tzinfo=timezone.utc)
            )
        ]
