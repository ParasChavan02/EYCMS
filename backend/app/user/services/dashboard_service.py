from sqlalchemy.orm import Session
from app.shared.logger import get_logger

logger = get_logger("user_dashboard_service")

class UserDashboardService:
    """
    Service that compiles fellow metrics for their specific project workspace.
    """
    @staticmethod
    def get_dashboard_kpis(db: Session, user_id: str) -> dict:
        import uuid
        from datetime import date
        from sqlalchemy import func
        from app.common.models.user import User
        from app.common.models.project import Project
        from app.common.models.budget import Budget
        from app.common.models.transaction import Transaction
        from app.common.models.expense import Expense
        from app.common.models.budget_head import BudgetHead

        logger.info(f"Aggregating fellow dashboard stats for user: {user_id}")

        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user or not user.project_id:
            return {
                "total_allocated_funds": 0.0,
                "spent_funds": 0.0,
                "days_remaining": 0,
                "pending_reimbursements": 0
            }

        project = db.query(Project).filter(Project.id == user.project_id).first()

        # 1. Total Allocated Funds
        total_allocated = db.query(func.sum(Budget.total_allocated)).filter(
            Budget.project_id == user.project_id
        ).scalar() or 0.0

        # 2. Spent Funds (Transactions with APPROVED status)
        spent = db.query(func.sum(Transaction.amount)).join(Expense).join(BudgetHead).join(Budget).filter(
            Budget.project_id == user.project_id,
            Transaction.status == "APPROVED"
        ).scalar() or 0.0

        # 3. Days Remaining
        days_rem = 0
        if project:
            days_rem = max(0, (project.end_date - date.today()).days)

        # 4. Pending Reimbursements
        pending_count = db.query(func.count(Transaction.id)).join(Expense).join(BudgetHead).join(Budget).filter(
            Budget.project_id == user.project_id,
            Transaction.status.in_(["PENDING", "SUBMITTED", "DRAFT"])
        ).scalar() or 0

        return {
            "total_allocated_funds": float(total_allocated),
            "spent_funds": float(spent),
            "days_remaining": int(days_rem),
            "pending_reimbursements": int(pending_count)
        }
