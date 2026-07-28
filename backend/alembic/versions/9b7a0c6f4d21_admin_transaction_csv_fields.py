"""Add CSV import/export fields to transactions

Revision ID: 9b7a0c6f4d21
Revises: 5c7fe3622a69
Create Date: 2026-07-25 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b7a0c6f4d21"
down_revision: Union[str, None] = "5c7fe3622a69"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("transactions", sa.Column("transaction_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "transactions",
        sa.Column("source", sa.String(length=50), server_default=sa.text("'MANUAL'"), nullable=False),
    )
    op.add_column("transactions", sa.Column("imported_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("transactions", sa.Column("imported_by_id", sa.Uuid(), nullable=True))
    op.add_column("transactions", sa.Column("import_batch_id", sa.String(length=128), nullable=True))

    op.create_index(op.f("ix_transactions_source"), "transactions", ["source"], unique=False)
    op.create_index(op.f("ix_transactions_import_batch_id"), "transactions", ["import_batch_id"], unique=False)
    op.create_index(op.f("ix_transactions_transaction_date"), "transactions", ["transaction_date"], unique=False)
    op.create_foreign_key(
        "fk_transactions_imported_by_id_users",
        "transactions",
        "users",
        ["imported_by_id"],
        ["id"],
    )

    op.execute("UPDATE transactions SET transaction_date = created_at WHERE transaction_date IS NULL")


def downgrade() -> None:
    op.drop_constraint("fk_transactions_imported_by_id_users", "transactions", type_="foreignkey")
    op.drop_index(op.f("ix_transactions_transaction_date"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_import_batch_id"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_source"), table_name="transactions")
    op.drop_column("transactions", "import_batch_id")
    op.drop_column("transactions", "imported_by_id")
    op.drop_column("transactions", "imported_at")
    op.drop_column("transactions", "source")
    op.drop_column("transactions", "transaction_date")
