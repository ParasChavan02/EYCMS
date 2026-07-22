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
        from app.common.models.user import User
        from app.common.models.transaction import Transaction
        from app.common.models.expense import Expense
        from app.common.models.budget_head import BudgetHead
        from app.common.models.budget import Budget

        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user or not user.project_id:
            return []

        txs = db.query(Transaction).join(Expense).join(BudgetHead).join(Budget).filter(
            Budget.project_id == user.project_id
        ).order_by(Transaction.created_at.desc()).all()

        return [
            FellowTransactionItem(
                id=str(t.id),
                amount=float(t.amount),
                budget_head=t.expense.budget_head.name,
                description=t.description,
                status=t.status,
                created_at=t.created_at
            ) for t in txs
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
