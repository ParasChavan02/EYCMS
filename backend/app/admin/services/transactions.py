from __future__ import annotations

import csv
import hashlib
import io
import os
import re
import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Dict

from fastapi import HTTPException, status, UploadFile
from sqlalchemy import Date, String, cast, func, or_
from sqlalchemy.orm import Session, joinedload

from app.admin.schemas.financial_schemas import (
    AdminTransactionDashboardCounters,
    AdminTransactionItem,
    TransactionCsvRowError,
    TransactionCsvStageResponse,
)
from app.common.models.audit_log import AuditLog
from app.common.models.budget_head import BudgetHead
from app.common.models.expense import Expense
from app.common.models.project import Project
from app.common.models.project_file import ProjectFile
from app.common.models.transaction import Transaction
from app.common.models.user import User

MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024
CSV_STAGING_CACHE: Dict[str, Dict] = {}


def _normalize_header(value: str) -> str:
    return re.sub(r"\s+", "_", value.strip().lower())


def _clean_text(value: Optional[str]) -> str:
    if value is None:
        return ""
    return re.sub(r"[\x00]", "", str(value)).strip()


def _parse_amount(raw_value: Optional[str]) -> Decimal:
    cleaned = _clean_text(raw_value)
    if not cleaned:
        raise ValueError("Invalid amount")
    try:
        amount = Decimal(cleaned.replace(",", "").replace("₹", "").replace("$", ""))
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
        lambda val: datetime.strptime(val, "%d/%m/%Y"),
        lambda val: datetime.strptime(val, "%d-%m-%Y"),
    )

    for parser in parsers:
        try:
            parsed = parser(cleaned)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed
        except Exception:
            continue
    raise ValueError("Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY")


class AdminTransactionCsvService:
    @staticmethod
    def get_dashboard_counters(db: Session) -> AdminTransactionDashboardCounters:
        all_txns = db.query(Transaction).all()

        pending_review = 0
        approved = 0
        admin_recorded = 0
        awaiting_reconciliation = 0
        reconciled = 0
        rejected = 0
        historical = 0
        locked = 0

        for t in all_txns:
            st = (t.status or "DRAFT").upper()
            rec_st = (t.reconciliation_status or "NOT_READY").upper()
            src = (t.source or "MANUAL").upper()

            if t.is_historical or src == "HISTORICAL" or st == "HISTORICAL":
                historical += 1

            if st in ("DRAFT", "PENDING", "PENDING_REVIEW", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"):
                pending_review += 1
            elif st == "APPROVED":
                approved += 1
            elif st == "ADMIN_RECORDED" or src == "ADMIN":
                admin_recorded += 1
            elif st == "REJECTED":
                rejected += 1
            elif st == "LOCKED":
                locked += 1

            if rec_st == "AWAITING_RECONCILIATION":
                awaiting_reconciliation += 1
            elif rec_st in ("AUTO_MATCHED", "MANUALLY_MATCHED", "JOURNAL_CLOSED", "CONFIRMED", "RECONCILED"):
                reconciled += 1
            elif rec_st == "LOCKED":
                locked += 1

        return AdminTransactionDashboardCounters(
            pending_review=pending_review,
            approved=approved,
            admin_recorded=admin_recorded,
            awaiting_reconciliation=awaiting_reconciliation,
            reconciled=reconciled,
            rejected=rejected,
            historical=historical,
            locked=locked,
        )

    @staticmethod
    def list_transactions(
        db: Session,
        search: Optional[str] = None,
        source: Optional[str] = None,
        status_filter: Optional[str] = None,
        reconciliation_status: Optional[str] = None,
        grant: Optional[str] = None,
        budget_head: Optional[str] = None,
        vendor: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        created_by: Optional[str] = None,
        is_historical: Optional[bool] = None,
        transaction_id: Optional[uuid.UUID] = None,
    ) -> List[AdminTransactionItem]:
        query = (
            db.query(Transaction)
            .outerjoin(Expense, Transaction.expense_id == Expense.id)
            .outerjoin(BudgetHead, Expense.budget_head_id == BudgetHead.id)
            .outerjoin(User, Transaction.created_by_id == User.id)
            .outerjoin(Project, Transaction.grant_id == Project.id)
            .outerjoin(ProjectFile, Transaction.bill_id == ProjectFile.id)
            .options(
                joinedload(Transaction.expense).joinedload(Expense.budget_head),
                joinedload(Transaction.creator),
                joinedload(Transaction.project),
                joinedload(Transaction.bill),
            )
        )

        if transaction_id:
            query = query.filter(Transaction.id == transaction_id)

        if source and source.upper() != "ALL":
            query = query.filter(func.upper(Transaction.source) == source.upper())

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(func.upper(Transaction.status) == status_filter.upper())

        if reconciliation_status and reconciliation_status.upper() != "ALL":
            query = query.filter(func.upper(Transaction.reconciliation_status) == reconciliation_status.upper())

        if budget_head and budget_head.upper() != "ALL":
            query = query.filter(BudgetHead.name.ilike(f"%{budget_head.strip()}%"))

        if vendor and vendor.upper() != "ALL":
            query = query.filter(Transaction.vendor.ilike(f"%{vendor.strip()}%"))

        if grant and grant.upper() != "ALL":
            query = query.filter(
                or_(
                    Project.title.ilike(f"%{grant.strip()}%"),
                    Project.project_id.ilike(f"%{grant.strip()}%"),
                )
            )

        if is_historical is not None:
            query = query.filter(Transaction.is_historical == is_historical)

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
            search_clean = search.strip()
            search_pattern = f"%{search_clean}%"
            or_conditions = [
                Transaction.description.ilike(search_pattern),
                Transaction.vendor.ilike(search_pattern),
                Transaction.reference_number.ilike(search_pattern),
                BudgetHead.name.ilike(search_pattern),
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                Transaction.status.ilike(search_pattern),
                Transaction.reconciliation_status.ilike(search_pattern),
            ]
            try:
                search_uuid = uuid.UUID(search_clean)
                or_conditions.append(Transaction.id == search_uuid)
            except ValueError:
                pass
            query = query.filter(or_(*or_conditions))

        rows = query.order_by(
            func.coalesce(Transaction.transaction_date, Transaction.created_at).desc(),
            Transaction.created_at.desc(),
        ).all()

        results: List[AdminTransactionItem] = []
        for txn in rows:
            txn_date = txn.transaction_date or txn.created_at
            if txn_date and txn_date.tzinfo is None:
                txn_date = txn_date.replace(tzinfo=timezone.utc)

            budget_head_name = "Unassigned"
            if txn.expense and txn.expense.budget_head:
                budget_head_name = txn.expense.budget_head.name
            elif txn.category:
                budget_head_name = txn.category

            grant_title = txn.project.title if txn.project else None

            bill_url = f"/uploads/bills/{os.path.basename(txn.bill.file_path)}" if txn.bill and txn.bill.file_path else None

            results.append(
                AdminTransactionItem(
                    id=str(txn.id),
                    date=txn_date or datetime.now(timezone.utc),
                    description=txn.description or "",
                    vendor=txn.vendor,
                    grant=grant_title,
                    grant_id=str(txn.grant_id) if txn.grant_id else None,
                    budget_line=budget_head_name,
                    amount=float(txn.amount),
                    source=txn.source or "MANUAL",
                    bill_id=str(txn.bill_id) if txn.bill_id else None,
                    bill_filename=txn.bill.original_file_name if txn.bill else None,
                    bill_url=bill_url,
                    status=txn.status or "DRAFT",
                    reconciliation_status=txn.reconciliation_status or "NOT_READY",
                    reference_number=txn.reference_number or f"REF-{str(txn.id)[:6].upper()}",
                    created_by_name=txn.creator.name if txn.creator else "System Admin",
                    created_by_email=txn.creator.email if txn.creator else None,
                    created_at=txn.created_at or datetime.now(timezone.utc),
                    is_historical=bool(txn.is_historical),
                    bank_transaction_id=str(txn.bank_transaction_id) if txn.bank_transaction_id else None,
                    reconciled_at=txn.reconciled_at,
                    match_type=txn.match_type,
                )
            )

        return results

    @staticmethod
    def admin_upload_bill(
        db: Session,
        file: Optional[UploadFile],
        amount: float,
        budget_line: str,
        vendor: str,
        description: str,
        grant_id: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
        transaction_date: Optional[datetime] = None,
    ) -> AdminTransactionItem:
        # Save file if provided
        project_file = None
        if file and file.filename:
            os.makedirs("uploads/bills", exist_ok=True)
            safe_filename = f"{uuid.uuid4()}_{os.path.basename(file.filename)}"
            file_path = os.path.join("uploads/bills", safe_filename)
            file_bytes = file.file.read()
            with open(file_path, "wb") as f:
                f.write(file_bytes)

            project_file = ProjectFile(
                uploaded_by_id=current_admin.id,
                file_name=safe_filename,
                original_file_name=file.filename,
                file_path=file_path,
                file_size=len(file_bytes),
                category="bill",
                status="APPROVED",
            )
            db.add(project_file)
            db.flush()

        # Find or create BudgetHead
        budget_head_obj = (
            db.query(BudgetHead)
            .filter(func.lower(BudgetHead.name) == budget_line.strip().lower())
            .first()
        )
        if not budget_head_obj:
            # Pick any active budget or create fallback
            from app.common.models.budget import Budget
            budget_obj = db.query(Budget).first()
            if not budget_obj:
                budget_obj = Budget(allocated_amount=Decimal(1000000))
                db.add(budget_obj)
                db.flush()
            budget_head_obj = BudgetHead(
                budget_id=budget_obj.id,
                name=budget_line.strip(),
                limit_amount=Decimal(500000),
            )
            db.add(budget_head_obj)
            db.flush()

        expense = Expense(
            budget_head_id=budget_head_obj.id,
            title=description[:150],
            allocated_amount=Decimal(str(amount)),
        )
        db.add(expense)
        db.flush()

        parsed_grant_id = None
        if grant_id:
            try:
                parsed_grant_id = uuid.UUID(grant_id)
            except ValueError:
                pass

        txn_dt = transaction_date or datetime.now(timezone.utc)
        txn = Transaction(
            expense_id=expense.id,
            amount=Decimal(str(amount)),
            description=description,
            vendor=vendor,
            grant_id=parsed_grant_id,
            project_id=parsed_grant_id,
            bill_id=project_file.id if project_file else None,
            created_by_id=current_admin.id,
            uploaded_by_id=current_admin.id,
            status="ADMIN_RECORDED",
            source="ADMIN",
            reconciliation_status="AWAITING_RECONCILIATION",
            category=budget_line.strip(),
            reference_number=f"ADM-{uuid.uuid4().hex[:6].upper()}",
            transaction_date=txn_dt,
        )
        db.add(txn)

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Bill Uploaded & Admin Expense Recorded",
            entity="Transaction",
            remarks=f"Admin expense recorded: {description} (₹{amount}) for vendor {vendor}. Status: ADMIN_RECORDED.",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()
        db.refresh(txn)

        return AdminTransactionCsvService.list_transactions(db, transaction_id=txn.id)[0]

    @staticmethod
    def stage_import_transactions(
        db: Session,
        file_bytes: bytes,
        filename: str,
        current_admin: User,
    ) -> TransactionCsvStageResponse:
        if not filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only CSV files (.csv) are supported.",
            )

        if len(file_bytes) > MAX_IMPORT_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"CSV file size exceeds the limit.",
            )

        try:
            csv_text = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CSV format. The file must be UTF-8 encoded.",
            )

        reader = csv.DictReader(io.StringIO(csv_text))
        if not reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty or missing headers.",
            )

        header_map = {_normalize_header(name): name for name in reader.fieldnames if name}

        req_fields = {"amount", "description"}
        missing = [col for col in req_fields if col not in header_map]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required CSV column(s): {', '.join(missing)}",
            )

        staged_rows = []
        errors: List[TransactionCsvRowError] = []
        duplicate_count = 0
        seen_ref_ids = set()

        # Existing transactions in DB for duplication check
        existing_txns = db.query(Transaction.reference_number, Transaction.amount, Transaction.description).all()
        existing_ref_nums = {t.reference_number for t in existing_txns if t.reference_number}

        for row_index, row in enumerate(reader, start=2):
            if not row or all(not _clean_text(val) for val in row.values()):
                continue

            desc = _clean_text(row.get(header_map.get("description", "")))
            amount_raw = row.get(header_map.get("amount", ""))
            vendor = _clean_text(row.get(header_map.get("vendor", ""))) or "General Vendor"
            budget_line = _clean_text(row.get(header_map.get("budget_line", "")) or row.get(header_map.get("budget_head", ""))) or "General Expense"
            grant = _clean_text(row.get(header_map.get("grant", "")) or row.get(header_map.get("grant_id", "")))
            date_raw = row.get(header_map.get("date", ""))
            ref_num = _clean_text(row.get(header_map.get("reference_number", "")) or row.get(header_map.get("transaction_id", "")))

            row_valid = True

            # Validate Description
            if not desc:
                errors.append(TransactionCsvRowError(row=row_index, field="description", reason="Missing description"))
                row_valid = False

            # Validate Amount
            amount_val = 0.0
            try:
                amount_dec = _parse_amount(amount_raw)
                amount_val = float(amount_dec)
            except ValueError as e:
                errors.append(TransactionCsvRowError(row=row_index, field="amount", reason=str(e)))
                row_valid = False

            # Validate Date
            txn_date_str = datetime.now(timezone.utc).isoformat()
            if date_raw:
                try:
                    dt = _parse_transaction_date(date_raw)
                    txn_date_str = dt.isoformat()
                except ValueError as e:
                    errors.append(TransactionCsvRowError(row=row_index, field="date", reason=str(e)))
                    row_valid = False

            # Duplicate detection
            is_dup = False
            if ref_num and (ref_num in existing_ref_nums or ref_num in seen_ref_ids):
                is_dup = True
                duplicate_count += 1
                errors.append(TransactionCsvRowError(row=row_index, field="reference_number", reason=f"Duplicate reference/transaction ID '{ref_num}'"))
            elif ref_num:
                seen_ref_ids.add(ref_num)

            staged_rows.append({
                "row_index": row_index,
                "description": desc,
                "amount": amount_val,
                "vendor": vendor,
                "budget_line": budget_line,
                "grant": grant,
                "date": txn_date_str,
                "reference_number": ref_num or f"IMP-{uuid.uuid4().hex[:6].upper()}",
                "is_valid": row_valid and not is_dup,
            })

        stage_token = hashlib.sha256(file_bytes).hexdigest()
        CSV_STAGING_CACHE[stage_token] = {
            "filename": filename,
            "admin_id": str(current_admin.id),
            "rows": staged_rows,
            "timestamp": datetime.now(timezone.utc),
        }

        valid_count = sum(1 for r in staged_rows if r["is_valid"])
        invalid_count = len(staged_rows) - valid_count

        return TransactionCsvStageResponse(
            total_rows=len(staged_rows),
            valid_count=valid_count,
            invalid_count=invalid_count,
            duplicate_count=duplicate_count,
            errors=errors,
            preview_rows=staged_rows,
            stage_token=stage_token,
        )

    @staticmethod
    def confirm_import_transactions(
        db: Session,
        stage_token: str,
        is_historical: bool,
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        staged_data = CSV_STAGING_CACHE.get(stage_token)
        if not staged_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staged CSV data not found or expired. Please upload and stage the file again.",
            )

        valid_rows = [r for r in staged_data["rows"] if r["is_valid"]]
        if not valid_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid rows to import.",
            )

        imported_count = 0
        now_utc = datetime.now(timezone.utc)
        target_source = "HISTORICAL" if is_historical else "IMPORT"
        target_status = "HISTORICAL" if is_historical else "APPROVED"

        for r in valid_rows:
            budget_head_obj = (
                db.query(BudgetHead)
                .filter(func.lower(BudgetHead.name) == r["budget_line"].strip().lower())
                .first()
            )
            if not budget_head_obj:
                from app.common.models.budget import Budget
                budget_obj = db.query(Budget).first()
                if not budget_obj:
                    budget_obj = Budget(allocated_amount=Decimal(1000000))
                    db.add(budget_obj)
                    db.flush()
                budget_head_obj = BudgetHead(
                    budget_id=budget_obj.id,
                    name=r["budget_line"].strip(),
                    limit_amount=Decimal(500000),
                )
                db.add(budget_head_obj)
                db.flush()

            expense = Expense(
                budget_head_id=budget_head_obj.id,
                title=r["description"][:150],
                allocated_amount=Decimal(str(r["amount"])),
            )
            db.add(expense)
            db.flush()

            dt = datetime.fromisoformat(r["date"])
            txn = Transaction(
                expense_id=expense.id,
                amount=Decimal(str(r["amount"])),
                description=r["description"],
                vendor=r["vendor"],
                reference_number=r["reference_number"],
                created_by_id=current_admin.id,
                status=target_status,
                source=target_source,
                reconciliation_status="AWAITING_RECONCILIATION",
                category=r["budget_line"],
                is_historical=is_historical,
                imported_at=now_utc,
                imported_by_id=current_admin.id,
                import_batch_id=stage_token,
                transaction_date=dt,
            )
            db.add(txn)
            imported_count += 1

        action_name = "Historical Transactions Imported" if is_historical else "Transactions Imported CSV"
        audit_log = AuditLog(
            user_id=current_admin.id,
            action=action_name,
            entity="Transaction",
            remarks=f"Imported {imported_count} transaction(s). Source: {target_source}. Is Historical: {is_historical}.",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        # Remove from cache
        CSV_STAGING_CACHE.pop(stage_token, None)

        return {
            "success": True,
            "imported": imported_count,
            "source": target_source,
            "is_historical": is_historical,
        }

    @staticmethod
    def export_transactions(
        db: Session,
        search: Optional[str] = None,
        source: Optional[str] = None,
        status_filter: Optional[str] = None,
        reconciliation_status: Optional[str] = None,
        grant: Optional[str] = None,
        budget_head: Optional[str] = None,
        vendor: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        created_by: Optional[str] = None,
        is_historical: Optional[bool] = None,
        current_admin: Optional[User] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        transactions = AdminTransactionCsvService.list_transactions(
            db=db,
            search=search,
            source=source,
            status_filter=status_filter,
            reconciliation_status=reconciliation_status,
            grant=grant,
            budget_head=budget_head,
            vendor=vendor,
            date_from=date_from,
            date_to=date_to,
            created_by=created_by,
            is_historical=is_historical,
        )

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        headers = [
            "Transaction ID",
            "Date",
            "Description",
            "Vendor",
            "Grant",
            "Budget Line",
            "Amount",
            "Source",
            "Transaction Status",
            "Reconciliation Status",
            "Reference Number",
            "Created By",
            "Created At",
        ]
        writer.writerow(headers)

        for txn in transactions:
            writer.writerow([
                txn.id,
                txn.date.date().isoformat() if txn.date else "",
                txn.description,
                txn.vendor or "",
                txn.grant or "",
                txn.budget_line,
                f"{Decimal(str(txn.amount)).quantize(Decimal('0.01'))}",
                txn.source,
                txn.status,
                txn.reconciliation_status,
                txn.reference_number or "",
                txn.created_by_name,
                txn.created_at.isoformat() if txn.created_at else "",
            ])

        if current_admin:
            audit_log = AuditLog(
                user_id=current_admin.id,
                action="Transactions Exported",
                entity="Transaction",
                remarks=f"Exported {len(transactions)} transaction record(s) to CSV.",
                ip_address=ip_address,
            )
            db.add(audit_log)
            db.commit()

        return buffer.getvalue()
