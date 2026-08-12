from __future__ import annotations

import csv
import hashlib
import io
import os
import re
import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Dict, Any

from fastapi import HTTPException, status, UploadFile
from sqlalchemy import Date, String, cast, func, or_
from sqlalchemy.orm import Session, joinedload

from app.admin.schemas import (
    AdminTransactionImportError,
    AdminTransactionImportResponse,
    AdminTransactionItem,
)
from app.admin.schemas.financial_schemas import (
    AdminTransactionStageResponse,
    AdminTransactionStagedRow,
)
from app.common.constants.enums import TransactionStatusEnum
from app.common.models.audit_log import AuditLog
from app.common.models.budget_head import BudgetHead
from app.common.models.expense import Expense
from app.common.models.project_file import ProjectFile
from app.common.models.transaction import Transaction
from app.common.models.user import User

# In-memory staging token store for multi-step transaction CSV imports
STAGE_TRANSACTION_STORE: Dict[str, Dict[str, Any]] = {}

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


class AdminTransactionCsvService:
    @staticmethod
    def get_dashboard_counters(db: Session) -> Dict[str, int]:
        all_txns = db.query(Transaction).all()
        counters = {
            "pending_review": 0,
            "approved": 0,
            "admin_recorded": 0,
            "awaiting_reconciliation": 0,
            "reconciled": 0,
            "rejected": 0,
            "historical": 0,
            "locked": 0,
        }
        for t in all_txns:
            st = (t.status or "").upper()
            rec_st = (t.reconciliation_status or "").upper()

            if st in ["PENDING", "PENDING_REVIEW", "VERIFIED"]:
                counters["pending_review"] += 1
            if st in ["APPROVED", "ADMIN_RECORDED", "CONFIRMED", "JOURNAL_CLOSED"]:
                counters["approved"] += 1
            if st == "ADMIN_RECORDED" or t.source == "ADMIN":
                counters["admin_recorded"] += 1
            if rec_st == "AWAITING_RECONCILIATION":
                counters["awaiting_reconciliation"] += 1
            if rec_st in ["AUTO_MATCHED", "MANUALLY_MATCHED", "CONFIRMED", "JOURNAL_CLOSED"]:
                counters["reconciled"] += 1
            if st == "REJECTED":
                counters["rejected"] += 1
            if t.is_historical or t.source == "HISTORICAL" or st == "HISTORICAL":
                counters["historical"] += 1
            if rec_st == "LOCKED" or st == "LOCKED":
                counters["locked"] += 1

        return counters

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
        query = db.query(Transaction).options(
            joinedload(Transaction.expense).joinedload(Expense.budget_head),
            joinedload(Transaction.bill),
            joinedload(Transaction.creator),
        )

        if transaction_id:
            query = query.filter(Transaction.id == transaction_id)

        if search:
            parsed_uuid = None
            try:
                parsed_uuid = uuid.UUID(search.strip())
            except ValueError:
                pass

            pattern = f"%{search.strip().lower()}%"
            if parsed_uuid:
                query = query.filter(Transaction.id == parsed_uuid)
            else:
                query = query.join(Transaction.expense).outerjoin(Expense.budget_head).filter(
                    or_(
                        func.lower(Transaction.description).like(pattern),
                        func.lower(Transaction.vendor).like(pattern),
                        func.lower(Transaction.reference_number).like(pattern),
                        func.lower(BudgetHead.name).like(pattern),
                    )
                )

        if source and source.upper() != "ALL":
            query = query.filter(Transaction.source == source.upper())

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(func.upper(Transaction.status) == status_filter.upper())

        if reconciliation_status and reconciliation_status.upper() != "ALL":
            query = query.filter(func.upper(Transaction.reconciliation_status) == reconciliation_status.upper())

        if budget_head and budget_head.upper() != "ALL":
            query = query.join(Transaction.expense).join(Expense.budget_head).filter(
                func.lower(BudgetHead.name) == budget_head.strip().lower()
            )

        if vendor and vendor.strip():
            query = query.filter(func.lower(Transaction.vendor).like(f"%{vendor.strip().lower()}%"))

        if is_historical is not None:
            query = query.filter(Transaction.is_historical == is_historical)

        if date_from:
            query = query.filter(Transaction.transaction_date >= date_from)

        if date_to:
            query = query.filter(Transaction.transaction_date <= date_to)

        txns = query.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc()).all()

        results = []
        for t in txns:
            head_name = "Unallocated"
            if t.category:
                head_name = t.category
            elif t.expense and t.expense.budget_head:
                head_name = t.expense.budget_head.name

            bill_url = None
            bill_fname = None
            if t.bill:
                bill_url = f"/api/v1/files/{t.bill.id}/download"
                bill_fname = t.bill.original_file_name or t.bill.file_name

            results.append(
                AdminTransactionItem(
                    id=str(t.id),
                    amount=float(t.amount or 0),
                    description=t.description or "Transaction Record",
                    vendor=t.vendor or "Unspecified Vendor",
                    grant=str(t.grant_id) if t.grant_id else "General Funds",
                    budget_line=head_name,
                    budget_head=head_name,
                    date=t.transaction_date.isoformat() if t.transaction_date else t.created_at.isoformat(),
                    created_by_name=t.creator.name if t.creator else "System Admin",
                    status=t.status or "ADMIN_RECORDED",
                    source=t.source or "ADMIN",
                    reconciliation_status=t.reconciliation_status or "AWAITING_RECONCILIATION",
                    bill_url=bill_url,
                    bill_filename=bill_fname,
                    reference_number=t.reference_number,
                    is_historical=t.is_historical or False,
                )
            )

        return results

    @staticmethod
    def admin_upload_bill(
        db: Session,
        file_bytes: Optional[bytes],
        filename: Optional[str],
        amount: float,
        budget_line: str,
        vendor: str,
        description: str,
        grant_id: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
        transaction_date: Optional[datetime] = None,
    ) -> AdminTransactionItem:
        project_file = None
        if file_bytes and filename:
            os.makedirs("uploads/bills", exist_ok=True)
            safe_filename = f"{uuid.uuid4()}_{os.path.basename(filename)}"
            file_path = os.path.join("uploads/bills", safe_filename)
            with open(file_path, "wb") as f:
                f.write(file_bytes)

            project_file = ProjectFile(
                uploaded_by_id=current_admin.id,
                file_name=safe_filename,
                original_file_name=filename,
                file_path=file_path,
                file_size=len(file_bytes),
                category="bill",
                status="APPROVED",
            )
            db.add(project_file)
            db.flush()

        budget_head_obj = (
            db.query(BudgetHead)
            .filter(func.lower(BudgetHead.name) == budget_line.strip().lower())
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
    ) -> AdminTransactionStageResponse:
        if len(file_bytes) > MAX_IMPORT_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 5MB.",
            )

        try:
            content_str = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file encoding. CSV file must be UTF-8 encoded.",
            )

        reader = csv.reader(io.StringIO(content_str))
        rows = [row for row in reader if any(cell.strip() for cell in row)]
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded CSV file is empty.",
            )

        raw_headers = rows[0]
        header_map = {_normalize_header(col): idx for idx, col in enumerate(raw_headers)}

        valid_rows = []
        errors = []
        duplicate_count = 0
        seen_fingerprints = set()

        for idx, row in enumerate(rows[1:], start=2):
            b_line = row[header_map["budget_line"]].strip() if "budget_line" in header_map and header_map["budget_line"] < len(row) else "Travel"
            amt_str = row[header_map["amount"]].strip() if "amount" in header_map and header_map["amount"] < len(row) else ""
            desc = row[header_map["description"]].strip() if "description" in header_map and header_map["description"] < len(row) else "CSV Import Record"
            vendor = row[header_map["vendor"]].strip() if "vendor" in header_map and header_map["vendor"] < len(row) else "Vendor Service"
            dt_str = row[header_map["date"]].strip() if "date" in header_map and header_map["date"] < len(row) else ""
            ref_num = row[header_map["reference_number"]].strip() if "reference_number" in header_map and header_map["reference_number"] < len(row) else ""

            try:
                amt = float(amt_str)
                if amt <= 0:
                    raise ValueError()
            except ValueError:
                errors.append({"row": idx, "field": "amount", "reason": f"Invalid amount '{amt_str}'. Must be a positive number."})
                continue

            parsed_dt = datetime.now(timezone.utc)
            if dt_str:
                try:
                    parsed_dt = datetime.fromisoformat(dt_str)
                    if parsed_dt.tzinfo is None:
                        parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                except ValueError:
                    pass

            fingerprint = hashlib.md5(f"{dt_str}_{amt}_{desc.lower()}_{vendor.lower()}".encode("utf-8")).hexdigest()
            if fingerprint in seen_fingerprints:
                duplicate_count += 1
            seen_fingerprints.add(fingerprint)

            valid_rows.append({
                "row_index": idx,
                "date": parsed_dt.isoformat(),
                "description": desc,
                "vendor": vendor,
                "budget_line": b_line,
                "amount": amt,
                "reference_number": ref_num or f"IMP-{uuid.uuid4().hex[:6].upper()}",
                "is_valid": True,
            })

        stage_token = uuid.uuid4().hex
        STAGE_TRANSACTION_STORE[stage_token] = {
            "valid_rows": valid_rows,
            "filename": filename,
            "created_by": current_admin.id,
        }

        return AdminTransactionStageResponse(
            stage_token=stage_token,
            total_rows=len(rows) - 1,
            valid_count=len(valid_rows),
            invalid_count=len(errors),
            duplicate_count=duplicate_count,
            errors=errors,
            preview_rows=[AdminTransactionStagedRow(**r) for r in valid_rows[:50]],
        )

    @staticmethod
    def confirm_import_transactions(
        db: Session,
        stage_token: str,
        is_historical: bool,
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        data = STAGE_TRANSACTION_STORE.get(stage_token)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired stage token. Please upload CSV again.",
            )

        valid_rows = data["valid_rows"]
        imported_count = 0

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

            txn_dt = datetime.fromisoformat(r["date"])
            status_val = "HISTORICAL" if is_historical else "ADMIN_RECORDED"
            source_val = "HISTORICAL" if is_historical else "IMPORT"

            txn = Transaction(
                expense_id=expense.id,
                amount=Decimal(str(r["amount"])),
                description=r["description"],
                vendor=r["vendor"],
                created_by_id=current_admin.id,
                uploaded_by_id=current_admin.id,
                status=status_val,
                source=source_val,
                reconciliation_status="AWAITING_RECONCILIATION",
                category=r["budget_line"],
                reference_number=r["reference_number"],
                is_historical=is_historical,
                transaction_date=txn_dt,
            )
            db.add(txn)
            imported_count += 1

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="CSV Transactions Imported",
            entity="Transaction",
            remarks=f"Imported {imported_count} transactions from CSV token {stage_token}. Historical: {is_historical}.",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        del STAGE_TRANSACTION_STORE[stage_token]
        return {"imported": imported_count, "is_historical": is_historical}

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
        txns = AdminTransactionCsvService.list_transactions(
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

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Transaction ID",
            "Reference Number",
            "Date",
            "Description",
            "Vendor",
            "Grant",
            "Budget Line",
            "Amount",
            "Source",
            "Status",
            "Reconciliation Status",
            "Created By",
            "Is Historical",
        ])

        for t in txns:
            writer.writerow([
                t.id,
                t.reference_number or "",
                t.date.isoformat() if isinstance(t.date, datetime) else str(t.date),
                t.description,
                t.vendor,
                t.grant,
                t.budget_line,
                t.amount,
                t.source,
                t.status,
                t.reconciliation_status,
                t.created_by_name,
                "YES" if t.is_historical else "NO",
            ])

        return output.getvalue()
