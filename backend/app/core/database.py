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
    from sqlalchemy import inspect
    # Import all models to register them on Base metadata
    from app.common.models import Base as ModelsBase
    
    # Create all new tables (support_ticket_messages, email_logs)
    ModelsBase.metadata.create_all(bind=engine)
    
    # Check and dynamically append missing columns to existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    is_postgres = engine.dialect.name == "postgresql"
    uuid_type = "UUID" if is_postgres else "CHAR(36)"

    # Helper to check if a column exists in a table
    def column_exists(table_name, col_name):
        if table_name not in existing_tables:
            return False
        cols = inspector.get_columns(table_name)
        return any(c["name"].lower() == col_name.lower() for c in cols)

    # Helper to execute alter statement if column doesn't exist
    def add_column_if_missing(table, column, col_type_and_constraints):
        if not column_exists(table, column):
            stmt = f"ALTER TABLE {table} ADD COLUMN {column} {col_type_and_constraints}"
            try:
                with engine.begin() as conn:
                    conn.execute(text(stmt))
                print(f"Added column {column} to table {table}")
            except Exception as e:
                print(f"Failed to add column {column} to table {table}: {e}")

    # 1. Update 'notifications' table
    add_column_if_missing("notifications", "action_path", "VARCHAR(255)")
    add_column_if_missing("notifications", "action_label", "VARCHAR(100)")

    # 2. Update 'support_tickets' table
    add_column_if_missing("support_tickets", "description", "TEXT")
    add_column_if_missing("support_tickets", "assigned_to_id", f"{uuid_type} REFERENCES users(id)")
    add_column_if_missing("support_tickets", "admin_notes", "TEXT")
    add_column_if_missing("support_tickets", "estimated_resolution_time", "VARCHAR(100)")
    add_column_if_missing("support_tickets", "updated_at", "TIMESTAMP")
    add_column_if_missing("support_tickets", "resolved_at", "TIMESTAMP")
    add_column_if_missing("support_tickets", "closed_at", "TIMESTAMP")

    # 3. Update 'transactions' table
    add_column_if_missing("transactions", "transaction_date", "TIMESTAMP")
    add_column_if_missing("transactions", "source", "VARCHAR(50)")
    add_column_if_missing("transactions", "imported_at", "TIMESTAMP")
    add_column_if_missing("transactions", "imported_by_id", f"{uuid_type} REFERENCES users(id)")
    add_column_if_missing("transactions", "import_batch_id", "VARCHAR(128)")
    add_column_if_missing("transactions", "project_id", f"{uuid_type} REFERENCES projects(id)")
    add_column_if_missing("transactions", "team_id", f"{uuid_type} REFERENCES teams(id)")
    add_column_if_missing("transactions", "bill_id", f"{uuid_type} REFERENCES project_files(id)")
    add_column_if_missing("transactions", "uploaded_by_id", f"{uuid_type} REFERENCES users(id)")
    add_column_if_missing("transactions", "category", "VARCHAR(100)")
    add_column_if_missing("transactions", "reconciliation_status", "VARCHAR(50) DEFAULT 'PENDING'")

    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE transactions SET source = 'MANUAL' WHERE source IS NULL"))
    except Exception:
        pass
    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE transactions SET transaction_date = created_at WHERE transaction_date IS NULL"))
    except Exception:
        pass

    # 4. Update 'events' table
    add_column_if_missing("events", "event_id", "VARCHAR(50)")
    add_column_if_missing("events", "type", "VARCHAR(100)")
    add_column_if_missing("events", "date", "DATE")
    add_column_if_missing("events", "time", "TIME")
    add_column_if_missing("events", "venue", "VARCHAR(150)")
    add_column_if_missing("events", "coordinator", "VARCHAR(150)")
    add_column_if_missing("events", "created_by", f"{uuid_type} REFERENCES users(id)")
    add_column_if_missing("events", "updated_at", "TIMESTAMP")
    add_column_if_missing("events", "cancelled_by", f"{uuid_type} REFERENCES users(id)")
    add_column_if_missing("events", "cancelled_at", "TIMESTAMP")
    add_column_if_missing("events", "cancel_reason", "TEXT")

    try:
        with engine.begin() as conn:
            conn.execute(text("UPDATE events SET status = 'UPCOMING' WHERE status IS NULL OR TRIM(status) = ''"))
    except Exception:
        pass

    # 5. Update 'users' table
    add_column_if_missing("users", "team_configured", "BOOLEAN DEFAULT FALSE")
    add_column_if_missing("users", "team_id", f"{uuid_type} REFERENCES teams(id)")
    add_column_if_missing("users", "department", "VARCHAR(100)")
    add_column_if_missing("users", "status", "VARCHAR(50) DEFAULT 'Active'")
    add_column_if_missing("users", "joining_date", "DATE")
    add_column_if_missing("users", "contact_number", "VARCHAR(50)")

