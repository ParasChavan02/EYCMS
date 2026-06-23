from typing import List, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
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
    def admin_create_transaction(
        db: Session, 
        transaction_data: AdminCreateTransaction, 
        admin_id: str
    ) -> dict:
        # Mock transaction payload creation
        return {
            "id": str(uuid.uuid4()),
            "amount": transaction_data.amount,
            "budget_head": transaction_data.budget_head,
            "description": transaction_data.description,
            "creator_role": "ADMIN",
            "created_by": admin_id,
            "status": "APPROVED",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def review_transaction(
        db: Session, 
        review_data: AdminTransactionReview, 
        admin_id: str
    ) -> dict:
        # Mock transaction review operation
        return {
            "transaction_id": review_data.transaction_id,
            "status": f"{review_data.action}ED",
            "remarks": review_data.remarks,
            "reviewed_by": admin_id,
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }
