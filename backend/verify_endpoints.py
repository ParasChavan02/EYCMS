import sys
import os

# Add parent path to import app correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

try:
    print("Verifying backend components...")
    
    print("1. Checking configurations and database...")
    from app.core.config import settings
    from app.core.database import SessionLocal, init_db, engine
    print("   Database URL:", settings.DATABASE_URL)
    
    print("2. Checking models...")
    from app.common.models import (
        Base, Role, User, Project, AdminToken, Budget, BudgetHead, Expense, 
        Transaction, QuarterlyReport, SupportTicket, SupportTicketMessage, EmailLog, Notification,
        Team, Invitation
    )
    print("   Models loaded successfully!")
    
    print("3. Checking services...")
    from app.notifications.services.notification_service import NotificationService
    from app.support.services import SupportService
    from app.common.services.email_service import EmailService
    from app.teams.services import TeamService
    from app.invitations.services import InvitationService
    print("   Services loaded successfully!")
    
    print("4. Checking schemas...")
    from app.notifications.schemas import NotificationResponse, NotificationBroadcast
    from app.support.schemas import SupportTicketCreate, SupportTicketResponse
    from app.teams.schemas import TeamSetupRequest
    from app.invitations.schemas import InvitationAcceptRequest
    print("   Schemas loaded successfully!")
    
    print("5. Checking routers...")
    from app.user.routers import user_router, notifications_router
    from app.admin.routers import admin_router
    from app.teams.routers import router as teams_router
    from app.invitations.routers import router as invitations_router
    print("   Routers loaded successfully!")
    
    print("\n✅ Verification Successful: All backend components are syntactically correct and import successfully!")

except Exception as e:
    print("\n❌ Verification Failed: An error occurred during imports:")
    import traceback
    traceback.print_exc()
    sys.exit(1)
