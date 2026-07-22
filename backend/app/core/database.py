from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy database models.
    """
    pass

def init_db():
    """
    Programmatic schema initializer to guarantee tables and columns exist
    across database backends (SQLite/PostgreSQL) without shell dependency.
    """
    # Import all models to register them on Base metadata
    from app.common.models import Base as ModelsBase
    
    # Create all new tables (support_ticket_messages, email_logs)
    ModelsBase.metadata.create_all(bind=engine)
    
    # Check and dynamically append missing columns to existing tables
    with engine.begin() as conn:
        # 1. Update 'notifications' table
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN action_path VARCHAR(255)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN action_label VARCHAR(100)"))
        except Exception:
            pass

        # 2. Update 'support_tickets' table
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN description TEXT"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN assigned_to_id CHAR(36) REFERENCES users(id)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN admin_notes TEXT"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN estimated_resolution_time VARCHAR(100)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN updated_at TIMESTAMP"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMP"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE support_tickets ADD COLUMN closed_at TIMESTAMP"))
        except Exception:
            pass

        # 3. Update 'users' table
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN team_configured BOOLEAN DEFAULT FALSE"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN team_id CHAR(36) REFERENCES teams(id)"))
        except Exception:
            pass
