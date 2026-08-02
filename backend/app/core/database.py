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

        # 3. Update 'transactions' table
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN transaction_date TIMESTAMP"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN source VARCHAR(50)"))
            conn.execute(text("UPDATE transactions SET source = 'MANUAL' WHERE source IS NULL"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN imported_at TIMESTAMP"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN imported_by_id CHAR(36) REFERENCES users(id)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN import_batch_id VARCHAR(128)"))
        except Exception:
            pass
        try:
            conn.execute(text("UPDATE transactions SET transaction_date = created_at WHERE transaction_date IS NULL"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN project_id CHAR(36) REFERENCES projects(id)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN team_id CHAR(36) REFERENCES teams(id)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN bill_id CHAR(36) REFERENCES project_files(id)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN uploaded_by_id CHAR(36) REFERENCES users(id)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN category VARCHAR(100)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN reconciliation_status VARCHAR(50) DEFAULT 'PENDING'"))
        except Exception:
            pass

        # 4. Update 'events' table for the redesigned Events module
        for stmt in [
            "ALTER TABLE events ADD COLUMN event_id VARCHAR(50)",
            "ALTER TABLE events ADD COLUMN type VARCHAR(100)",
            "ALTER TABLE events ADD COLUMN date DATE",
            "ALTER TABLE events ADD COLUMN time TIME",
            "ALTER TABLE events ADD COLUMN venue VARCHAR(150)",
            "ALTER TABLE events ADD COLUMN coordinator VARCHAR(150)",
            "ALTER TABLE events ADD COLUMN created_by CHAR(36) REFERENCES users(id)",
            "ALTER TABLE events ADD COLUMN updated_at TIMESTAMP",
            "ALTER TABLE events ADD COLUMN cancelled_by CHAR(36) REFERENCES users(id)",
            "ALTER TABLE events ADD COLUMN cancelled_at TIMESTAMP",
            "ALTER TABLE events ADD COLUMN cancel_reason TEXT",
        ]:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass

        try:
            conn.execute(text("UPDATE events SET status = 'UPCOMING' WHERE status IS NULL OR TRIM(status) = ''"))
        except Exception:
            pass

        # 5. Update 'users' table
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN team_configured BOOLEAN DEFAULT FALSE"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN team_id CHAR(36) REFERENCES teams(id)"))
        except Exception:
            pass
