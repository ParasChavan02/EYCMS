from sqlalchemy.orm import Session
from app.shared.logger import get_logger

logger = get_logger("admin_dashboard_service")

class AdminDashboardService:
    """
    Service that compiles admin metrics across projects, budgets,
    reports, transactions, and support tickets.
    """
    @staticmethod
    def get_dashboard_kpis(db: Session) -> dict:
        logger.info("Aggregating metrics for administrative dashboard")
        # Placeholder dictionary structure mapping relational tables
        return {
            "total_users": 20,
            "active_users": 18,
            "projects": 10,
            "reports": {
                "total": 40,
                "pending": 6,
                "approved": 30,
                "rejected": 4
            },
            "transactions": {
                "total_count": 85,
                "pending_count": 12,
                "approved_count": 65,
                "rejected_count": 8
            },
            "pending_uc_requests": 4,
            "approved_ucs": 15,
            "pending_reports": 6,
            "budget_summary": {
                "total_allocated": 500000.00,
                "total_utilized": 320000.00,
                "total_remaining": 180000.00
            },
            "recent_activities": [
                {
                    "timestamp": "2026-06-29T14:30:00Z",
                    "user": "John Doe",
                    "action": "Submitted Q3 report",
                    "module": "Reports"
                }
            ],
            "upcoming_deadlines": [
                {
                    "title": "Quarterly UC compliance check",
                    "due_date": "2026-07-15"
                }
            ]
        }
