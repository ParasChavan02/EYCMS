from typing import List, Optional
from datetime import datetime, timezone
import uuid
from decimal import Decimal
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from app.common.constants.enums import TransactionStatusEnum
from app.common.models.audit_log import AuditLog
from app.common.models.budget_head import BudgetHead
from app.common.models.expense import Expense
from app.common.models.transaction import Transaction
from app.common.models.user import User
from app.admin.schemas import (
    AdminDashboardKPIs,
    UserProgressMonitoring,
    UserProgressDetail,
    AdminCreateTransaction,
    AdminTransactionReview
)

class AdminService:
    """
    Service layer containing core logic for administration dashboard,
    user monitoring, and reviewing requests.
    """
    @staticmethod
    def get_dashboard_kpis(db: Session) -> AdminDashboardKPIs:
        # Mock KPIs representation
        return AdminDashboardKPIs(
            total_active_users=15,
            users_near_deadline=4,
            pending_reviews=6,
            completed_reports=24,
            pending_uc_requests=3
        )

    @staticmethod
    def get_users_progress(
        db: Session, 
        status_filter: Optional[str] = None, 
        search_query: Optional[str] = None
    ) -> List[UserProgressMonitoring]:
        # Mock progress list
        return [
            UserProgressMonitoring(
                user_id="11111111-1111-1111-1111-111111111111",
                user_name="John Doe",
                project_id="EY-2026-042",
                date_of_joining=datetime(2025, 8, 1, tzinfo=timezone.utc),
                days_remaining=185,
                fellowship_month=11,
                program_progress_percent=82.5,
                assigned_events=5,
                submitted_reports=10,
                uploaded_documents=12,
                pending_reviews=1,
                current_status="Active"
            ),
            UserProgressMonitoring(
                user_id="22222222-2222-2222-2222-222222222222",
                user_name="Jane Smith",
                project_id="EY-2026-089",
                date_of_joining=datetime(2025, 4, 1, tzinfo=timezone.utc),
                days_remaining=45,
                fellowship_month=15,
                program_progress_percent=95.0,
                assigned_events=3,
                submitted_reports=14,
                uploaded_documents=18,
                pending_reviews=0,
                current_status="Completed"
            )
        ]

    @staticmethod
    def get_user_progress_detail(db: Session, user_id: str) -> UserProgressDetail:
        # Mock user detailed status
        return UserProgressDetail(
            project_id="EY-2026-042",
            user_name="John Doe",
            email="johndoe@example.com",
            date_of_joining=datetime(2025, 8, 1, tzinfo=timezone.utc),
            fellowship_duration_months=24,
            days_remaining=185,
            current_status="Active"
        )

    @staticmethod
    def get_budget_heads(db: Session) -> List[str]:
        heads = db.query(BudgetHead.name).order_by(BudgetHead.name.asc()).all()

        unique_heads = []
        seen = set()
        for (name,) in heads:
            normalized = (name or "").strip()
            if not normalized:
                continue

            key = normalized.lower()
            if key in seen:
                continue

            seen.add(key)
            unique_heads.append(normalized)

        return unique_heads

    @staticmethod
    def admin_create_transaction(
        db: Session, 
        transaction_data: AdminCreateTransaction, 
        admin_id: str
    ) -> dict:
        admin = db.query(User).filter(User.id == uuid.UUID(admin_id)).first()
        if not admin:
            raise ValueError("Admin user not found")

        budget_head = (
            db.query(BudgetHead)
            .filter(func.lower(BudgetHead.name) == transaction_data.budget_head.strip().lower())
            .first()
        )
        if not budget_head:
            raise ValueError("Budget Head not found")

        amount = Decimal(str(transaction_data.amount)).quantize(Decimal("0.01"))
        if amount <= 0:
            raise ValueError("Invalid amount")

        now_utc = datetime.now(timezone.utc)
        description = (transaction_data.description or budget_head.name).strip()
        expense = Expense(
            budget_head_id=budget_head.id,
            title=description[:150],
            allocated_amount=amount,
        )
        transaction = Transaction(
            expense=expense,
            amount=amount,
            description=description,
            transaction_date=now_utc,
            created_by_id=admin.id,
            status=TransactionStatusEnum.DRAFT.value,
            source="MANUAL",
        )
        db.add(expense)
        db.add(transaction)
        db.add(
            AuditLog(
                user_id=admin.id,
                action="Transaction Created",
                entity="Transaction",
                remarks=f"Budget Head: {budget_head.name}\nAmount: {amount}\nTimestamp: {now_utc.isoformat()}",
            )
        )
        db.commit()
        db.refresh(transaction)

        return {
            "id": str(transaction.id),
            "amount": float(transaction.amount),
            "budget_head": budget_head.name,
            "description": transaction.description,
            "creator_role": admin.role.name if admin.role else "ADMIN",
            "created_by": admin_id,
            "status": transaction.status,
            "created_at": transaction.created_at.isoformat() if transaction.created_at else now_utc.isoformat(),
        }

    @staticmethod
    def review_transaction(
        db: Session, 
        review_data: AdminTransactionReview, 
        admin_id: str
    ) -> dict:
        admin = db.query(User).filter(User.id == uuid.UUID(admin_id)).first()
        if not admin:
            raise ValueError("Admin user not found")

        transaction = (
            db.query(Transaction)
            .options(joinedload(Transaction.expense).joinedload(Expense.budget_head))
            .filter(Transaction.id == uuid.UUID(review_data.transaction_id))
            .first()
        )
        if not transaction:
            raise ValueError("Transaction not found")

        action = review_data.action.upper().strip()
        if action == "APPROVE":
            transaction.status = TransactionStatusEnum.APPROVED.value
            transaction.approved_by_id = admin.id
        elif action == "REJECT":
            transaction.status = TransactionStatusEnum.REJECTED.value
        elif action == "REQUEST_REVISION":
            transaction.status = TransactionStatusEnum.REVISION_REQUESTED.value
        else:
            raise ValueError("Invalid review action")

        transaction.admin_remarks = review_data.remarks
        transaction.updated_at = datetime.now(timezone.utc)

        db.add(transaction)
        db.add(
            AuditLog(
                user_id=admin.id,
                action="Transaction Reviewed",
                entity="Transaction",
                remarks=(
                    f"Transaction: {review_data.transaction_id}\n"
                    f"Action: {action}\n"
                    f"Remarks: {review_data.remarks or '-'}\n"
                    f"Timestamp: {datetime.now(timezone.utc).isoformat()}"
                ),
            )
        )
        db.commit()

        return {
            "transaction_id": review_data.transaction_id,
            "status": transaction.status,
            "remarks": review_data.remarks,
            "reviewed_by": admin_id,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }
