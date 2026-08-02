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
            total_active_users=0,
            users_near_deadline=0,
            pending_reviews=0,
            completed_reports=0,
            pending_uc_requests=0
        )

    @staticmethod
    def get_users_progress(
        db: Session, 
        status_filter: Optional[str] = None, 
        search_query: Optional[str] = None
    ) -> List[UserProgressMonitoring]:
        # Mock progress list
        return []

    @staticmethod
    def get_user_progress_detail(db: Session, user_id: str) -> UserProgressDetail:
        # Mock user detailed status
        return UserProgressDetail(
            project_id="",
            user_name="",
            email="",
            date_of_joining=datetime.now(timezone.utc),
            fellowship_duration_months=0,
            days_remaining=0,
            current_status=""
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
<<<<<<< HEAD
        is_recon = getattr(review_data, "is_reconciliation", False)

        if is_recon:
            if action == "APPROVE":
                transaction.reconciliation_status = "APPROVED"
                transaction.approved_by_id = admin.id
            elif action == "REJECT":
                transaction.reconciliation_status = "REJECTED"
            elif action == "REQUEST_REVISION":
                transaction.reconciliation_status = "REVISION_REQUESTED"
            else:
                raise ValueError("Invalid review action")
        else:
            if action == "APPROVE":
                transaction.status = TransactionStatusEnum.APPROVED.value
                transaction.approved_by_id = admin.id
            elif action == "REJECT":
                transaction.status = TransactionStatusEnum.REJECTED.value
            elif action == "REQUEST_REVISION":
                transaction.status = TransactionStatusEnum.REVISION_REQUESTED.value
            else:
                raise ValueError("Invalid review action")
=======
        if action == "APPROVE":
            transaction.status = TransactionStatusEnum.APPROVED.value
            transaction.approved_by_id = admin.id
        elif action == "REJECT":
            transaction.status = TransactionStatusEnum.REJECTED.value
        elif action == "REQUEST_REVISION":
            transaction.status = TransactionStatusEnum.REVISION_REQUESTED.value
        else:
            raise ValueError("Invalid review action")
>>>>>>> 529928889db3e04ebd354e4e18f79b71321a45df

        transaction.admin_remarks = review_data.remarks
        transaction.updated_at = datetime.now(timezone.utc)

        db.add(transaction)
<<<<<<< HEAD

        # Send dynamic notification to the creator/uploader
        target_user_id = transaction.uploaded_by_id or transaction.created_by_id
        if target_user_id:
            from app.notifications.services.notification_service import NotificationService
            if is_recon:
                title_msg = "Transaction Reconciled" if action == "APPROVE" else "Reconciliation Rejected" if action == "REJECT" else "Reconciliation Revision Requested"
                detail_msg = f"Your transaction '{transaction.description}' has been reconciled and approved by the admin." if action == "APPROVE" else f"Your transaction reconciliation '{transaction.description}' has been rejected by the admin." if action == "REJECT" else f"Reconciliation details update requested for '{transaction.description}'."
                type_msg = "success" if action == "APPROVE" else "error" if action == "REJECT" else "info"
                path_msg = "/reconciliation"
                label_msg = "View Reconciliation"
            else:
                title_msg = "Transaction Approved" if action == "APPROVE" else "Transaction Rejected" if action == "REJECT" else "Transaction Revision Requested"
                detail_msg = f"Your expense bill transaction '{transaction.description}' has been approved by the admin." if action == "APPROVE" else f"Your transaction '{transaction.description}' has been rejected." if action == "REJECT" else f"Revision requested for transaction '{transaction.description}'."
                type_msg = "success" if action == "APPROVE" else "error" if action == "REJECT" else "info"
                path_msg = "/transactions"
                label_msg = "View Transactions"

            NotificationService.create_notification(
                db=db,
                user_id=str(target_user_id),
                title=title_msg,
                message=detail_msg,
                type=type_msg,
                action_path=path_msg,
                action_label=label_msg
              )

=======
>>>>>>> 529928889db3e04ebd354e4e18f79b71321a45df
        db.add(
            AuditLog(
                user_id=admin.id,
                action="Transaction Reviewed",
                entity="Transaction",
                remarks=(
                    f"Transaction: {review_data.transaction_id}\n"
                    f"Action: {action}\n"
<<<<<<< HEAD
                    f"Reconciliation Review: {is_recon}\n"
=======
>>>>>>> 529928889db3e04ebd354e4e18f79b71321a45df
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
