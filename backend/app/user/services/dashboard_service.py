from sqlalchemy.orm import Session
from app.shared.logger import get_logger

logger = get_logger("user_dashboard_service")

class UserDashboardService:
    """
    Service that compiles fellow metrics for their specific project workspace.
    """
    @staticmethod
    def get_dashboard_kpis(db: Session, user_id: str) -> dict:
        logger.info(f"Aggregating fellow dashboard stats for user: {user_id}")
        # Placeholder dict structure mapping the fellow project details
        return {
            "project_id": "EY-2026-042",
            "project_name": "Autonomous ERP Backend Formulations",
            "date_of_joining": "2025-08-01T00:00:00Z",
            "days_remaining": 185,
            "program_duration_months": 24,
            "program_progress_percent": 72.5,
            "assigned_events": 5,
            "reports_submitted": 10,
            "documents_uploaded": 12,
            "pending_reviews": 1,
            "recent_activities": [
                {
                    "timestamp": "2026-06-28T09:15:00Z",
                    "action": "Uploaded travel invoice",
                    "module": "Transactions"
                }
            ],
            "upcoming_events": [
                {
                    "title": "Semi-Annual Evaluation Panel",
                    "event_date": "2026-07-10T11:00:00Z"
                }
            ],
            "mentor_information": {
                "name": "Dr. Sarah Connor",
                "email": "sconnor@example.com"
            }
        }
