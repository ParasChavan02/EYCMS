from __future__ import annotations

import csv
import hashlib
import io
import re
import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal, InvalidOperation
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import Date, cast, func, or_
from sqlalchemy.orm import Session, joinedload

from app.admin.schemas import (
    AdminTransactionImportError,
    AdminTransactionImportResponse,
    AdminTransactionItem,
)
from app.common.constants.enums import TransactionStatusEnum
from app.common.models.audit_log import AuditLog
from app.common.models.budget_head import BudgetHead
from app.common.models.expense import Expense
from app.common.models.transaction import Transaction
from app.common.models.user import User

MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024
REQUIRED_COLUMNS = {"budget_head", "amount"}
OPTIONAL_COLUMNS = {"description", "date", "status"}
CSV_COLUMNS = ["budget_head", "amount", "description", "date", "status"]
ALLOWED_STATUSES = {item.value for item in TransactionStatusEnum}


def _normalize_header(value: str) -> str:
    return re.sub(r"\s+", "_", value.strip().lower())


def _clean_text(value: Optional[str]) -> str:
    if value is None:
        return ""
    return re.sub(r"[\x00]", "", str(value)).strip()


def _normalize_status(value: Optional[str]) -> str:
    if not value:
        return TransactionStatusEnum.DRAFT.value
    normalized = re.sub(r"[\s\-]+", "_", _clean_text(value)).upper()
    return normalized


def _parse_amount(raw_value: Optional[str]) -> Decimal:
    cleaned = _clean_text(raw_value)
    if not cleaned:
        raise ValueError("Invalid amount")
    try:
        amount = Decimal(cleaned.replace(",", ""))
    except (InvalidOperation, TypeError):
        raise ValueError("Invalid amount")
    if amount <= 0:
        raise ValueError("Invalid amount")
    return amount.quantize(Decimal("0.01"))


def _parse_transaction_date(raw_value: Optional[str]) -> datetime:
    cleaned = _clean_text(raw_value)
    if not cleaned:
        return datetime.now(timezone.utc)

    parsers = (
        lambda val: datetime.fromisoformat(val.replace("Z", "+00:00")),
        lambda val: datetime.combine(date.fromisoformat(val), time.min, tzinfo=timezone.utc),
    )

    for parser in parsers:
        try:
            parsed = parser(cleaned)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed
        except Exception:
            continue
    raise ValueError("Invalid date")


def _normalize_date_key(value: Optional[datetime]) -> Optional[str]:
    if not value:
        return None
    dt_val = value
    if dt_val.tzinfo is None:
        dt_val = dt_val.replace(tzinfo=timezone.utc)
    return dt_val.date().isoformat()


class AdminTransactionCsvService:
    @staticmethod
    def list_transactions(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        budget_head: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        created_by: Optional[str] = None,
    ) -> List[AdminTransactionItem]:
        query = (
            db.query(Transaction)
            .join(Expense, Transaction.expense_id == Expense.id)
            .join(BudgetHead, Expense.budget_head_id == BudgetHead.id)
            .outerjoin(User, Transaction.created_by_id == User.id)
            .options(
                joinedload(Transaction.expense).joinedload(Expense.budget_head),
                joinedload(Transaction.creator),
                joinedload(Transaction.imported_by),
            )
        )

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Transaction.status == status_filter.upper())

        if budget_head:
            query = query.filter(BudgetHead.name.ilike(f"%{budget_head.strip()}%"))

        if date_from:
            query = query.filter(cast(func.coalesce(Transaction.transaction_date, Transaction.created_at), Date) >= date_from.date())

        if date_to:
            query = query.filter(cast(func.coalesce(Transaction.transaction_date, Transaction.created_at), Date) <= date_to.date())

        if created_by:
            created_filter = f"%{created_by.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(created_filter),
                    User.email.ilike(created_filter),
                )
            )

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Transaction.description.ilike(search_pattern),
                    BudgetHead.name.ilike(search_pattern),
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    Transaction.status.ilike(search_pattern),
                )
            )

        rows = query.order_by(
            func.coalesce(Transaction.transaction_date, Transaction.created_at).desc(),
            Transaction.created_at.desc(),
        ).all()

        results: List[AdminTransactionItem] = []
        for txn in rows:
            txn_date = txn.transaction_date or txn.created_at
            if txn_date and txn_date.tzinfo is None:
                txn_date = txn_date.replace(tzinfo=timezone.utc)

            results.append(
                AdminTransactionItem(
                    id=str(txn.id),
                    budget_head=txn.expense.budget_head.name if txn.expense and txn.expense.budget_head else "Unassigned",
                    amount=float(txn.amount),
                    description=txn.description,
                    date=txn_date or datetime.now(timezone.utc),
                    status=txn.status,
                    created_by_name=txn.creator.name if txn.creator else "Unknown",
                    created_by_email=txn.creator.email if txn.creator else None,
                    created_by_role=txn.creator.role.name if txn.creator and txn.creator.role else None,
                    source=txn.source or "MANUAL",
                    imported_at=txn.imported_at,
                    imported_by_name=txn.imported_by.name if txn.imported_by else None,
                    imported_by_email=txn.imported_by.email if txn.imported_by else None,
                    import_batch_id=txn.import_batch_id,
<<<<<<< HEAD
                    reconciliation_status=txn.reconciliation_status or "PENDING",
=======
>>>>>>> 529928889db3e04ebd354e4e18f79b71321a45df
                )
            )

        return results

    @staticmethod
    def import_transactions(
        db: Session,
        file_bytes: bytes,
        filename: str,
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> AdminTransactionImportResponse:
        if not filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CSV format. Only .csv files are allowed.",
            )

        if len(file_bytes) > MAX_IMPORT_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"CSV file size exceeds the {MAX_IMPORT_FILE_SIZE // (1024 * 1024)}MB limit.",
            )

        batch_id = hashlib.sha256(file_bytes).hexdigest()
        existing_batch = (
            db.query(Transaction.id)
            .filter(Transaction.source == "IMPORT", Transaction.import_batch_id == batch_id)
            .first()
        )
        if existing_batch:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This import file has already been processed.",
            )

        try:
            csv_text = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CSV format. The file must be UTF-8 encoded.",
            )

        try:
            reader = csv.DictReader(io.StringIO(csv_text))
        except csv.Error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CSV format.",
            )

        if not reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CSV format.",
            )

        header_map = {_normalize_header(name): name for name in reader.fieldnames if name}
        missing_required = [column for column in REQUIRED_COLUMNS if column not in header_map]
        if missing_required:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required column(s): {', '.join(missing_required)}",
            )

        imported = 0
        skipped = 0
        errors: List[AdminTransactionImportError] = []
        seen_rows = set()
        now_utc = datetime.now(timezone.utc)

        try:
            for row_index, row in enumerate(reader, start=2):
                if not row or all(not _clean_text(value) for value in row.values()):
                    continue

                budget_head_name = _clean_text(row.get(header_map["budget_head"]))
                amount_raw = row.get(header_map["amount"])
                description = _clean_text(row.get(header_map.get("description", ""))) or budget_head_name
                date_raw = row.get(header_map.get("date", ""))
                status_raw = row.get(header_map.get("status", ""))

                try:
                    if not budget_head_name:
                        raise ValueError("Budget Head not found")

                    budget_head = (
                        db.query(BudgetHead)
                        .filter(func.lower(BudgetHead.name) == budget_head_name.lower())
                        .first()
                    )
                    if not budget_head:
                        raise ValueError("Budget Head not found")

                    amount = _parse_amount(amount_raw)
                    transaction_date = _parse_transaction_date(date_raw)
                    status_value = _normalize_status(status_raw)
                    if status_value not in ALLOWED_STATUSES:
                        raise ValueError("Invalid status")

                    duplicate_key = (
                        budget_head.id,
                        amount,
                        description.lower(),
                        _normalize_date_key(transaction_date),
                        status_value,
                    )
                    if duplicate_key in seen_rows:
                        raise ValueError("Duplicate transaction")

                    existing_duplicate = (
                        db.query(Transaction.id)
                        .join(Expense, Transaction.expense_id == Expense.id)
                        .filter(
                            Transaction.source == "IMPORT",
                            Expense.budget_head_id == budget_head.id,
                            Transaction.amount == amount,
                            func.lower(Transaction.description) == description.lower(),
                            cast(func.coalesce(Transaction.transaction_date, Transaction.created_at), Date)
                            == transaction_date.date(),
                            Transaction.status == status_value,
                        )
                        .first()
                    )
                    if existing_duplicate:
                        raise ValueError("Duplicate transaction")

                    expense = Expense(
                        budget_head_id=budget_head.id,
                        title=description[:150] if description else budget_head.name,
                        allocated_amount=amount,
                    )
                    transaction = Transaction(
                        expense=expense,
                        amount=amount,
                        description=description,
                        transaction_date=transaction_date,
                        created_by_id=current_admin.id,
                        status=status_value,
                        source="IMPORT",
                        imported_at=now_utc,
                        imported_by_id=current_admin.id,
                        import_batch_id=batch_id,
                    )

                    db.add(expense)
                    db.add(transaction)
                    seen_rows.add(duplicate_key)
                    imported += 1
                except ValueError as exc:
                    skipped += 1
                    errors.append(AdminTransactionImportError(row=row_index, reason=str(exc)))

            audit_log = AuditLog(
                user_id=current_admin.id,
                action="Transactions Imported",
                entity="Transaction",
                remarks=(
                    f"Filename: {filename}\n"
                    f"Imported: {imported}\n"
                    f"Skipped: {skipped}\n"
                    f"Batch: {batch_id}\n"
                    f"Timestamp: {now_utc.isoformat()}"
                ),
                ip_address=ip_address,
            )
            db.add(audit_log)
            db.commit()
        except HTTPException:
            db.rollback()
            raise
        except Exception as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(exc),
            )

        return AdminTransactionImportResponse(
            success=True,
            imported=imported,
            skipped=skipped,
            errors=errors,
            batch_id=batch_id,
        )

    @staticmethod
    def export_transactions(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        budget_head: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        created_by: Optional[str] = None,
        current_admin: Optional[User] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        transactions = AdminTransactionCsvService.list_transactions(
            db=db,
            search=search,
            status_filter=status_filter,
            budget_head=budget_head,
            date_from=date_from,
            date_to=date_to,
            created_by=created_by,
        )

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(CSV_COLUMNS)

        for txn in transactions:
            txn_date = txn.date
            if txn_date.tzinfo is None:
                txn_date = txn_date.replace(tzinfo=timezone.utc)
            writer.writerow(
                [
                    txn.budget_head,
                    f"{Decimal(str(txn.amount)).quantize(Decimal('0.01'))}",
                    txn.description,
                    txn_date.date().isoformat(),
                    txn.status,
                ]
            )

        if current_admin:
            audit_log = AuditLog(
                user_id=current_admin.id,
                action="Transactions Exported",
                entity="Transaction",
                remarks=(
                    f"Filters: search={search or 'ALL'}, status={status_filter or 'ALL'}, "
                    f"budget_head={budget_head or 'ALL'}, date_from={date_from.date().isoformat() if date_from else 'ALL'}, "
                    f"date_to={date_to.date().isoformat() if date_to else 'ALL'}, created_by={created_by or 'ALL'}\n"
                    f"Records: {len(transactions)}\n"
                    f"Timestamp: {datetime.now(timezone.utc).isoformat()}"
                ),
                ip_address=ip_address,
            )
            db.add(audit_log)
            db.commit()

        return buffer.getvalue()
