from typing import List
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from app.user.schemas import (
    FellowDashboardKPIs,
    UCRequestPayload,
    FellowTransactionItem
)

class UserService:
    """
    Service layer containing core logic for fellow-specific tracking,
    request submissions, and personal dashboards.
    """
    @staticmethod
    def get_dashboard_kpis(db: Session, user_id: str) -> FellowDashboardKPIs:
        # Mock KPIs representation for a fellow
        return FellowDashboardKPIs(
            total_allocated_funds=350000.00,
            spent_funds=142000.00,
            days_remaining=220,
            pending_reimbursements=3
        )

    @staticmethod
    def get_transactions(db: Session, user_id: str) -> List[FellowTransactionItem]:
        # Mock transactions specific to this user
        return [
            FellowTransactionItem(
                id="55555555-5555-5555-5555-555555555555",
                amount=1500.00,
                budget_head="Contingency",
                description="Reference text books purchase",
                status="APPROVED",
                created_at=datetime(2026, 5, 20, 11, 0, 0, tzinfo=timezone.utc)
            ),
            FellowTransactionItem(
                id="66666666-6666-6666-6666-666666666666",
                amount=4500.00,
                budget_head="Travel",
                description="Train tickets for workshop travel",
                status="SUBMITTED",
                created_at=datetime(2026, 6, 18, 9, 15, 0, tzinfo=timezone.utc)
            )
        ]

    @staticmethod
    def submit_uc_request(
        db: Session, 
        payload: UCRequestPayload, 
        user_id: str
    ) -> dict:
        # Mock utilization certificate submission
        return {
            "id": str(uuid.uuid4()),
            "requested_by_id": user_id,
            "amount": payload.amount,
            "budget_head": payload.budget_head,
            "status": "REQUESTED",
            "remarks": payload.remarks,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
