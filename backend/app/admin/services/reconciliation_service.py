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

from fastapi import HTTPException, status
from sqlalchemy import Date, cast, func, or_
from sqlalchemy.orm import Session, joinedload

from app.admin.schemas.financial_schemas import (
    ReconciliationSummaryKPIs,
    BankStatementStageResponse,
    BankTransactionItem,
    AutoMatchResponse,
    AutoMatchResultItem,
    TransactionCsvRowError,
)
from app.common.models.audit_log import AuditLog
from app.common.models.bank_transaction import BankTransaction
from app.common.models.budget_head import BudgetHead
from app.common.models.expense import Expense
from app.common.models.project_file import ProjectFile
from app.common.models.reconciliation_period import ReconciliationPeriod
from app.common.models.transaction import Transaction
from app.common.models.user import User

JOURNAL_ENTRY_THRESHOLD = 10000.0
BANK_CSV_STAGING_CACHE: Dict[str, Dict] = {}


def _clean(val: Optional[str]) -> str:
    if val is None:
        return ""
    return re.sub(r"[\x00]", "", str(val)).strip()


def _parse_num(val: Optional[str]) -> Decimal:
    cleaned = _clean(val)
    if not cleaned:
        return Decimal("0.00")
    cleaned = cleaned.replace(",", "").replace("₹", "").replace("$", "").replace("CR", "").replace("DR", "").strip()
    try:
        return Decimal(cleaned).quantize(Decimal("0.01"))
    except Exception:
        return Decimal("0.00")


def _parse_dt(val: Optional[str]) -> datetime:
    cleaned = _clean(val)
    if not cleaned:
        return datetime.now(timezone.utc)

    parsers = (
        lambda v: datetime.fromisoformat(v.replace("Z", "+00:00")),
        lambda v: datetime.combine(date.fromisoformat(v), time.min, tzinfo=timezone.utc),
        lambda v: datetime.strptime(v, "%d/%m/%Y"),
        lambda v: datetime.strptime(v, "%d-%m-%Y"),
    )
    for p in parsers:
        try:
            parsed = p(cleaned)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed
        except Exception:
            continue
    return datetime.now(timezone.utc)


class ReconciliationService:
    @staticmethod
    def get_summary(db: Session, period_name: Optional[str] = None) -> ReconciliationSummaryKPIs:
        query = db.query(BankTransaction)
        if period_name and period_name.upper() != "ALL":
            period_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == period_name).first()
            if period_obj:
                query = query.filter(BankTransaction.period_id == period_obj.id)

        all_bank_txns = query.all()

        imported = len(all_bank_txns)
        awaiting_reconciliation = 0
        auto_matched = 0
        manually_matched = 0
        unmatched = 0
        variances = 0
        journal_entries = 0
        confirmed = 0
        locked = 0

        for b in all_bank_txns:
            st = (b.match_status or "UNMATCHED").upper()
            if st == "UNMATCHED":
                unmatched += 1
                awaiting_reconciliation += 1
            elif st == "AUTO_MATCHED":
                auto_matched += 1
            elif st == "MANUALLY_MATCHED":
                manually_matched += 1
            elif st == "JOURNAL_ENTRY":
                journal_entries += 1
            elif st == "CONFIRMED":
                confirmed += 1
            elif st == "LOCKED":
                locked += 1

            if b.match_confidence == "PARTIAL_MATCH" or b.match_confidence == "MISMATCH":
                variances += 1

        return ReconciliationSummaryKPIs(
            imported=imported,
            awaiting_reconciliation=awaiting_reconciliation,
            auto_matched=auto_matched,
            manually_matched=manually_matched,
            unmatched=unmatched,
            variances=variances,
            journal_entries=journal_entries,
            confirmed=confirmed,
            locked=locked,
            journal_threshold=JOURNAL_ENTRY_THRESHOLD,
        )

    @staticmethod
    def list_bank_transactions(
        db: Session,
        period_name: Optional[str] = None,
        match_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[BankTransactionItem]:
        query = db.query(BankTransaction).options(
            joinedload(BankTransaction.matched_transaction).joinedload(Transaction.bill),
        )

        if period_name and period_name.upper() != "ALL":
            period_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == period_name).first()
            if period_obj:
                query = query.filter(BankTransaction.period_id == period_obj.id)

        if match_status and match_status.upper() != "ALL":
            query = query.filter(func.upper(BankTransaction.match_status) == match_status.upper())

        if search:
            pat = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    BankTransaction.bank_txn_id.ilike(pat),
                    BankTransaction.description.ilike(pat),
                    BankTransaction.reference_number.ilike(pat),
                    BankTransaction.match_status.ilike(pat),
                )
            )

        rows = query.order_by(BankTransaction.date.desc()).all()

        results = []
        for b in rows:
            matched_desc = b.matched_transaction.description if b.matched_transaction else None
            matched_bill_id = str(b.matched_transaction.bill_id) if b.matched_transaction and b.matched_transaction.bill_id else None
            matched_bill_url = f"/uploads/bills/{os.path.basename(b.matched_transaction.bill.file_path)}" if b.matched_transaction and b.matched_transaction.bill and b.matched_transaction.bill.file_path else None

            results.append(
                BankTransactionItem(
                    id=str(b.id),
                    bank_txn_id=b.bank_txn_id,
                    date=b.date,
                    description=b.description,
                    reference_number=b.reference_number,
                    debit=float(b.debit or 0),
                    credit=float(b.credit or 0),
                    amount=float(b.amount),
                    match_status=b.match_status or "UNMATCHED",
                    match_confidence=b.match_confidence,
                    match_type=b.match_type,
                    match_reason=b.match_reason,
                    matched_transaction_id=str(b.matched_transaction_id) if b.matched_transaction_id else None,
                    matched_transaction_desc=matched_desc,
                    matched_bill_id=matched_bill_id,
                    matched_bill_url=matched_bill_url,
                    period_id=str(b.period_id) if b.period_id else None,
                    notes=b.notes,
                )
            )

        return results

    @staticmethod
    def list_periods(db: Session) -> List[Dict]:
        periods = db.query(ReconciliationPeriod).order_by(ReconciliationPeriod.start_date.desc()).all()
        res = []
        for p in periods:
            res.append({
                "id": str(p.id),
                "period_name": p.period_name,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "status": p.status,
                "confirmed_at": p.confirmed_at.isoformat() if p.confirmed_at else None,
                "locked_at": p.locked_at.isoformat() if p.locked_at else None,
                "unlock_reason": p.unlock_reason,
            })
        return res

    @staticmethod
    def stage_import_bank_statement(
        db: Session,
        file_bytes: bytes,
        filename: str,
        current_admin: User,
    ) -> BankStatementStageResponse:
        if not filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only CSV files (.csv) are supported.",
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

        header_map = {_clean(name).lower().replace(" ", "_"): name for name in reader.fieldnames if name}

        staged_rows = []
        errors: List[TransactionCsvRowError] = []
        total_credits = Decimal("0.00")
        total_debits = Decimal("0.00")
        duplicate_rows = 0
        dates_list = []

        existing_bank_txns = {b.bank_txn_id for b in db.query(BankTransaction.bank_txn_id).all()}
        seen_bank_ids = set()

        for idx, row in enumerate(reader, start=2):
            if not row or all(not _clean(val) for val in row.values()):
                continue

            desc = _clean(row.get(header_map.get("description", "")) or row.get(header_map.get("narration", "")) or row.get(header_map.get("particulars", "")))
            ref_no = _clean(row.get(header_map.get("reference_number", "")) or row.get(header_map.get("check_no", "")) or row.get(header_map.get("ref_no", "")))
            bank_id = _clean(row.get(header_map.get("bank_txn_id", "")) or row.get(header_map.get("txn_id", "")) or row.get(header_map.get("id", "")))
            date_raw = row.get(header_map.get("date", "")) or row.get(header_map.get("value_date", ""))

            debit_dec = _parse_num(row.get(header_map.get("debit", "")) or row.get(header_map.get("withdrawal", "")))
            credit_dec = _parse_num(row.get(header_map.get("credit", "")) or row.get(header_map.get("deposit", "")))
            amount_raw = row.get(header_map.get("amount", ""))

            amount_dec = Decimal("0.00")
            if amount_raw:
                amount_dec = _parse_num(amount_raw)
            else:
                amount_dec = credit_dec - debit_dec if credit_dec > 0 else debit_dec

            if not bank_id:
                bank_id = f"BANK-{uuid.uuid4().hex[:8].upper()}"

            dt = _parse_dt(date_raw)
            dates_list.append(dt)

            total_credits += credit_dec
            total_debits += debit_dec

            is_dup = False
            if bank_id in existing_bank_txns or bank_id in seen_bank_ids:
                is_dup = True
                duplicate_rows += 1
                errors.append(TransactionCsvRowError(row=idx, field="bank_txn_id", reason=f"Duplicate Bank Transaction ID '{bank_id}'"))
            else:
                seen_bank_ids.add(bank_id)

            staged_rows.append({
                "row_index": idx,
                "bank_txn_id": bank_id,
                "date": dt.isoformat(),
                "description": desc or "Bank Transfer / Settlement",
                "reference_number": ref_no,
                "debit": float(debit_dec),
                "credit": float(credit_dec),
                "amount": float(amount_dec),
                "is_valid": not is_dup,
            })

        date_range_str = "N/A"
        if dates_list:
            min_d = min(dates_list).date().isoformat()
            max_d = max(dates_list).date().isoformat()
            date_range_str = f"{min_d} to {max_d}"

        stage_token = hashlib.sha256(file_bytes).hexdigest()
        BANK_CSV_STAGING_CACHE[stage_token] = {
            "filename": filename,
            "admin_id": str(current_admin.id),
            "rows": staged_rows,
            "timestamp": datetime.now(timezone.utc),
        }

        return BankStatementStageResponse(
            total_rows=len(staged_rows),
            total_credits=float(total_credits),
            total_debits=float(total_debits),
            duplicate_rows=duplicate_rows,
            invalid_rows=len(errors),
            date_range=date_range_str,
            errors=errors,
            preview_rows=staged_rows,
            stage_token=stage_token,
        )

    @staticmethod
    def confirm_import_bank_statement(
        db: Session,
        stage_token: str,
        period_name: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        staged = BANK_CSV_STAGING_CACHE.get(stage_token)
        if not staged:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staged bank statement data not found or expired.",
            )

        valid_rows = [r for r in staged["rows"] if r["is_valid"]]
        if not valid_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid bank statement rows to import.",
            )

        # Determine period
        first_dt = datetime.fromisoformat(valid_rows[0]["date"])
        p_name = period_name or first_dt.strftime("%Y-%m")

        period_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == p_name).first()
        if not period_obj:
            start_d = date(first_dt.year, first_dt.month, 1)
            # approx end of month
            end_d = date(first_dt.year, first_dt.month, 28)
            period_obj = ReconciliationPeriod(
                period_name=p_name,
                start_date=start_d,
                end_date=end_d,
                status="OPEN",
            )
            db.add(period_obj)
            db.flush()

        imported_count = 0
        for r in valid_rows:
            dt = datetime.fromisoformat(r["date"])
            bt = BankTransaction(
                bank_txn_id=r["bank_txn_id"],
                date=dt,
                description=r["description"],
                reference_number=r["reference_number"],
                debit=Decimal(str(r["debit"])),
                credit=Decimal(str(r["credit"])),
                amount=Decimal(str(r["amount"])),
                match_status="UNMATCHED",
                period_id=period_obj.id,
                imported_by_id=current_admin.id,
                import_batch_id=stage_token,
            )
            db.add(bt)
            imported_count += 1

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Bank CSV Imported",
            entity="BankTransaction",
            remarks=f"Imported {imported_count} bank statement transaction(s) into period {p_name}.",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        BANK_CSV_STAGING_CACHE.pop(stage_token, None)

        return {
            "success": True,
            "imported": imported_count,
            "period_name": p_name,
        }

    @staticmethod
    def auto_match(
        db: Session,
        period_name: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> AutoMatchResponse:
        bank_query = db.query(BankTransaction).filter(BankTransaction.match_status == "UNMATCHED")
        if period_name and period_name.upper() != "ALL":
            p_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == period_name).first()
            if p_obj:
                bank_query = bank_query.filter(BankTransaction.period_id == p_obj.id)

        unmatched_bank_txns = bank_query.all()
        available_ledger_txns = db.query(Transaction).options(
            joinedload(Transaction.bill),
            joinedload(Transaction.expense),
        ).filter(
            or_(
                Transaction.reconciliation_status == "NOT_READY",
                Transaction.reconciliation_status == "AWAITING_RECONCILIATION",
                Transaction.bank_transaction_id.is_(None),
            )
        ).all()

        results: List[AutoMatchResultItem] = []
        matched_count = 0
        now_utc = datetime.now(timezone.utc)

        matched_txn_ids = set()

        for b_txn in unmatched_bank_txns:
            b_amount = abs(float(b_txn.amount))
            b_date = b_txn.date
            b_desc = (b_txn.description or "").lower()
            b_ref = (b_txn.reference_number or "").lower()

            best_match = None
            best_priority = None
            best_confidence = None
            best_reason = []

            # -------------------------------------------------------------
            # PRIORITY 1: Bank Txn -> Approval Request / Bill Attached
            # -------------------------------------------------------------
            for l_txn in available_ledger_txns:
                if l_txn.id in matched_txn_ids:
                    continue
                if not l_txn.bill_id:
                    continue  # Priority 1 requires attached bill / approval request

                l_amount = abs(float(l_txn.amount))
                if abs(l_amount - b_amount) > 0.01:
                    continue  # Amount match required

                # Check date proximity (within 7 days)
                l_date = l_txn.transaction_date or l_txn.created_at
                days_diff = abs((b_date - l_date).days)
                if days_diff > 7:
                    continue

                reasons = [f"Amount: Exact (Rs.{b_amount})", f"Bill attached: {l_txn.bill.original_file_name if l_txn.bill else 'Attached'}"]
                if days_diff == 0:
                    reasons.append("Date: Exact match")
                else:
                    reasons.append(f"Date: ±{days_diff} day(s)")

                vendor_name = (l_txn.vendor or l_txn.description or "").lower()
                if vendor_name and (vendor_name in b_desc or b_desc in vendor_name):
                    reasons.append(f"Vendor/Description: Fuzzy match '{l_txn.vendor or l_txn.description}'")

                confidence = "EXACT_MATCH" if days_diff <= 1 and (vendor_name in b_desc or not vendor_name) else "HIGH_CONFIDENCE"
                best_match = l_txn
                best_priority = "PRIORITY_1_APPROVAL_BILL"
                best_confidence = confidence
                best_reason = reasons
                break

            # -------------------------------------------------------------
            # PRIORITY 2: Bank Txn -> General Ledger Pool
            # -------------------------------------------------------------
            if not best_match:
                for l_txn in available_ledger_txns:
                    if l_txn.id in matched_txn_ids:
                        continue

                    l_amount = abs(float(l_txn.amount))
                    if abs(l_amount - b_amount) > 0.01:
                        continue

                    l_date = l_txn.transaction_date or l_txn.created_at
                    days_diff = abs((b_date - l_date).days)
                    if days_diff > 14:
                        continue

                    reasons = [f"Amount: Exact (Rs.{b_amount})"]
                    if days_diff == 0:
                        reasons.append("Date: Exact match")
                    else:
                        reasons.append(f"Date: ±{days_diff} day(s)")

                    l_ref = (l_txn.reference_number or "").lower()
                    if l_ref and b_ref and (l_ref in b_ref or b_ref in l_ref):
                        reasons.append(f"Reference: Exact match '{l_txn.reference_number}'")

                    confidence = "HIGH_CONFIDENCE" if days_diff <= 3 else "PARTIAL_MATCH"
                    best_match = l_txn
                    best_priority = "PRIORITY_2_GENERAL_LEDGER"
                    best_confidence = confidence
                    best_reason = reasons
                    break

            if best_match:
                reason_str = ", ".join(best_reason)
                b_txn.match_status = "AUTO_MATCHED"
                b_txn.match_confidence = best_confidence
                b_txn.match_type = best_priority
                b_txn.match_reason = reason_str
                b_txn.matched_transaction_id = best_match.id

                best_match.bank_transaction_id = b_txn.id
                best_match.reconciliation_status = "AUTO_MATCHED"
                best_match.match_type = best_priority
                best_match.reconciled_at = now_utc

                matched_txn_ids.add(best_match.id)
                matched_count += 1

                results.append(AutoMatchResultItem(
                    bank_txn_id=b_txn.bank_txn_id,
                    matched_txn_id=str(best_match.id),
                    match_status="AUTO_MATCHED",
                    match_confidence=best_confidence,
                    match_type=best_priority,
                    match_reason=reason_str,
                ))
            else:
                results.append(AutoMatchResultItem(
                    bank_txn_id=b_txn.bank_txn_id,
                    matched_txn_id=None,
                    match_status="UNMATCHED",
                    match_confidence="UNMATCHED",
                    match_type="UNMATCHED",
                    match_reason="No matching ledger entry found within tolerance thresholds.",
                ))

        if matched_count > 0:
            audit_log = AuditLog(
                user_id=current_admin.id,
                action="Auto Match Executed",
                entity="BankTransaction",
                remarks=f"Executed Priority Auto-Match: {matched_count} bank transaction(s) auto-matched.",
                ip_address=ip_address,
            )
            db.add(audit_log)
            db.commit()

        return AutoMatchResponse(
            success=True,
            matched_count=matched_count,
            unmatched_count=len(unmatched_bank_txns) - matched_count,
            matches=results,
        )

    @staticmethod
    def manual_match(
        db: Session,
        bank_transaction_id: str,
        transaction_id: str,
        notes: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        bank_txn = db.query(BankTransaction).filter(BankTransaction.id == uuid.UUID(bank_transaction_id)).first()
        if not bank_txn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank transaction not found.")

        ledger_txn = db.query(Transaction).filter(Transaction.id == uuid.UUID(transaction_id)).first()
        if not ledger_txn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ledger transaction not found.")

        # Check lock status
        if bank_txn.match_status == "LOCKED" or ledger_txn.status == "LOCKED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify a locked transaction.")

        # Unlink previous match if replacing
        if bank_txn.matched_transaction_id and bank_txn.matched_transaction_id != ledger_txn.id:
            old_txn = db.query(Transaction).filter(Transaction.id == bank_txn.matched_transaction_id).first()
            if old_txn:
                old_txn.bank_transaction_id = None
                old_txn.reconciliation_status = "AWAITING_RECONCILIATION"
                old_txn.match_type = None

        now_utc = datetime.now(timezone.utc)
        bank_txn.match_status = "MANUALLY_MATCHED"
        bank_txn.match_confidence = "EXACT_MATCH"
        bank_txn.match_type = "MANUAL"
        bank_txn.match_reason = f"Manually matched by {current_admin.name}."
        bank_txn.matched_transaction_id = ledger_txn.id
        if notes:
            bank_txn.notes = notes

        ledger_txn.bank_transaction_id = bank_txn.id
        ledger_txn.reconciliation_status = "MANUALLY_MATCHED"
        ledger_txn.match_type = "MANUAL"
        ledger_txn.reconciled_at = now_utc

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Manual Match Executed",
            entity="BankTransaction",
            remarks=f"Manually matched Bank Txn {bank_txn.bank_txn_id} with Ledger Txn {ledger_txn.id}. Notes: {notes or 'N/A'}",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        return {"success": True, "message": "Manual match recorded successfully."}

    @staticmethod
    def unmatch(
        db: Session,
        bank_transaction_id: str,
        notes: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        bank_txn = db.query(BankTransaction).filter(BankTransaction.id == uuid.UUID(bank_transaction_id)).first()
        if not bank_txn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank transaction not found.")

        if bank_txn.match_status == "LOCKED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot unmatch a locked transaction.")

        if bank_txn.matched_transaction_id:
            ledger_txn = db.query(Transaction).filter(Transaction.id == bank_txn.matched_transaction_id).first()
            if ledger_txn:
                ledger_txn.bank_transaction_id = None
                ledger_txn.reconciliation_status = "AWAITING_RECONCILIATION"
                ledger_txn.match_type = None
                ledger_txn.reconciled_at = None

        bank_txn.match_status = "UNMATCHED"
        bank_txn.match_confidence = None
        bank_txn.match_type = None
        bank_txn.match_reason = None
        bank_txn.matched_transaction_id = None
        if notes:
            bank_txn.notes = notes

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Unmatch Executed",
            entity="BankTransaction",
            remarks=f"Unmatched Bank Txn {bank_txn.bank_txn_id}. Notes: {notes or 'N/A'}",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        return {"success": True, "message": "Transaction unmatched successfully."}

    @staticmethod
    def create_journal_entry(
        db: Session,
        bank_transaction_id: str,
        debit_account: str,
        credit_account: str,
        amount: float,
        narration: str,
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        if not narration or not narration.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Narration is mandatory for creating a journal entry.")

        bank_txn = db.query(BankTransaction).filter(BankTransaction.id == uuid.UUID(bank_transaction_id)).first()
        if not bank_txn:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank transaction not found.")

        if bank_txn.match_status == "LOCKED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot create journal entry on a locked record.")

        if float(bank_txn.amount) > JOURNAL_ENTRY_THRESHOLD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Journal entry fallback is restricted to unmatched bank transactions below ₹{JOURNAL_ENTRY_THRESHOLD:,.0f}.",
            )

        # Find or create BudgetHead for debit_account
        budget_head_obj = (
            db.query(BudgetHead)
            .filter(func.lower(BudgetHead.name) == debit_account.strip().lower())
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
                name=debit_account.strip(),
                limit_amount=Decimal(500000),
            )
            db.add(budget_head_obj)
            db.flush()

        expense = Expense(
            budget_head_id=budget_head_obj.id,
            title=narration[:150],
            allocated_amount=Decimal(str(amount)),
        )
        db.add(expense)
        db.flush()

        now_utc = datetime.now(timezone.utc)
        txn = Transaction(
            expense_id=expense.id,
            amount=Decimal(str(amount)),
            description=f"Journal Entry: {narration}",
            vendor=f"Account: {credit_account}",
            reference_number=f"JRN-{uuid.uuid4().hex[:6].upper()}",
            created_by_id=current_admin.id,
            status="APPROVED",
            source="JOURNAL",
            reconciliation_status="JOURNAL_CLOSED",
            category=debit_account.strip(),
            bank_transaction_id=bank_txn.id,
            reconciled_at=now_utc,
            match_type="JOURNAL_ENTRY",
            transaction_date=bank_txn.date,
        )
        db.add(txn)
        db.flush()

        bank_txn.match_status = "JOURNAL_ENTRY"
        bank_txn.match_confidence = "EXACT_MATCH"
        bank_txn.match_type = "JOURNAL_ENTRY"
        bank_txn.match_reason = f"Journal Closed: Debit {debit_account}, Credit {credit_account}. Narration: {narration}"
        bank_txn.matched_transaction_id = txn.id
        bank_txn.notes = narration

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Journal Entry Created",
            entity="BankTransaction",
            remarks=f"Created Journal Entry Txn {txn.id} for Bank Txn {bank_txn.bank_txn_id}. Debit: {debit_account}, Credit: {credit_account}, Amount: ₹{amount}. Narration: {narration}",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        return {"success": True, "message": "Journal entry created and bank transaction closed.", "transaction_id": str(txn.id)}

    @staticmethod
    def confirm_period(
        db: Session,
        period_name: str,
        notes: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        p_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == period_name).first()
        if not p_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Reconciliation period '{period_name}' not found.")

        # Check all bank transactions in this period are matched or closed by journal entry
        unresolved = db.query(BankTransaction).filter(
            BankTransaction.period_id == p_obj.id,
            BankTransaction.match_status == "UNMATCHED",
        ).count()

        if unresolved > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot confirm period '{period_name}': {unresolved} unmatched bank transaction(s) remain. Every transaction must be linked to a bill/transaction or closed by a journal entry.",
            )

        now_utc = datetime.now(timezone.utc)
        p_obj.status = "CONFIRMED"
        p_obj.confirmed_by_id = current_admin.id
        p_obj.confirmed_at = now_utc

        # Update bank transactions in period to CONFIRMED
        db.query(BankTransaction).filter(BankTransaction.period_id == p_obj.id).update(
            {"match_status": "CONFIRMED"}, synchronize_session=False
        )

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Reconciliation Confirmed",
            entity="ReconciliationPeriod",
            remarks=f"Confirmed reconciliation period '{period_name}'. Notes: {notes or 'N/A'}",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        return {"success": True, "message": f"Reconciliation period '{period_name}' confirmed."}

    @staticmethod
    def lock_period(
        db: Session,
        period_name: str,
        notes: Optional[str],
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        p_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == period_name).first()
        if not p_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Reconciliation period '{period_name}' not found.")

        now_utc = datetime.now(timezone.utc)
        p_obj.status = "LOCKED"
        p_obj.locked_by_id = current_admin.id
        p_obj.locked_at = now_utc

        # Lock all bank transactions in this period
        bank_txns = db.query(BankTransaction).filter(BankTransaction.period_id == p_obj.id).all()
        for b in bank_txns:
            b.match_status = "LOCKED"
            if b.matched_transaction_id:
                l_txn = db.query(Transaction).filter(Transaction.id == b.matched_transaction_id).first()
                if l_txn:
                    l_txn.status = "LOCKED"
                    l_txn.reconciliation_status = "LOCKED"

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="Period Locked",
            entity="ReconciliationPeriod",
            remarks=f"Locked reconciliation period '{period_name}'. All records made read-only. Notes: {notes or 'N/A'}",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        return {"success": True, "message": f"Reconciliation period '{period_name}' locked."}

    @staticmethod
    def unlock_period(
        db: Session,
        period_name: str,
        reason: str,
        current_admin: User,
        ip_address: Optional[str] = None,
    ) -> Dict:
        if not reason or not reason.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reason for unlocking is mandatory.")

        p_obj = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == period_name).first()
        if not p_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Reconciliation period '{period_name}' not found.")

        now_utc = datetime.now(timezone.utc)
        p_obj.status = "OPEN"
        p_obj.unlock_reason = reason
        p_obj.unlocked_by_id = current_admin.id
        p_obj.unlocked_at = now_utc

        # Unlock bank transactions in period
        bank_txns = db.query(BankTransaction).filter(BankTransaction.period_id == p_obj.id).all()
        for b in bank_txns:
            b.match_status = "CONFIRMED"
            if b.matched_transaction_id:
                l_txn = db.query(Transaction).filter(Transaction.id == b.matched_transaction_id).first()
                if l_txn:
                    l_txn.status = "APPROVED"
                    l_txn.reconciliation_status = "CONFIRMED"

        audit_log = AuditLog(
            user_id=current_admin.id,
            action="PERIOD_UNLOCKED",
            entity="ReconciliationPeriod",
            remarks=f"Period '{period_name}' unlocked by {current_admin.name} ({current_admin.email}). Reason: {reason}. Timestamp: {now_utc.isoformat()}",
            ip_address=ip_address,
        )
        db.add(audit_log)
        db.commit()

        return {"success": True, "message": f"Reconciliation period '{period_name}' unlocked."}

    @staticmethod
    def export_reconciliation(
        db: Session,
        period_name: Optional[str] = None,
        match_status: Optional[str] = None,
        current_admin: Optional[User] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        bank_txns = ReconciliationService.list_bank_transactions(
            db=db,
            period_name=period_name,
            match_status=match_status,
        )

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        headers = [
            "Bank Transaction ID",
            "Date",
            "Description",
            "Reference",
            "Amount",
            "Matched Ledger ID",
            "Source",
            "Match Type",
            "Match Status",
            "Variance",
            "Remarks",
            "Created By",
            "Created At",
        ]
        writer.writerow(headers)

        for b in bank_txns:
            variance_val = "YES" if b.match_confidence in ("PARTIAL_MATCH", "MISMATCH") else "NO"
            writer.writerow([
                b.bank_txn_id,
                b.date.date().isoformat() if b.date else "",
                b.description,
                b.reference_number or "",
                f"{Decimal(str(b.amount)).quantize(Decimal('0.01'))}",
                b.matched_transaction_id or "",
                "BANK",
                b.match_type or "",
                b.match_status,
                variance_val,
                b.notes or b.match_reason or "",
                current_admin.name if current_admin else "System",
                b.date.isoformat() if b.date else "",
            ])

        if current_admin:
            audit_log = AuditLog(
                user_id=current_admin.id,
                action="Reconciliation Exported",
                entity="BankTransaction",
                remarks=f"Exported {len(bank_txns)} reconciliation record(s) to CSV.",
                ip_address=ip_address,
            )
            db.add(audit_log)
            db.commit()

        return buffer.getvalue()
