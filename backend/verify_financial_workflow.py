import os
import sys
import io
import uuid
from datetime import datetime, timezone

# Add backend root directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import UploadFile
from app.core.database import SessionLocal, init_db
from app.common.models.user import User
from app.common.models.project_file import ProjectFile
from app.common.models.role import Role
from app.common.models.transaction import Transaction
from app.common.models.bank_transaction import BankTransaction
from app.common.models.reconciliation_period import ReconciliationPeriod
from app.common.models.audit_log import AuditLog
from app.admin.services.transactions import AdminTransactionCsvService
from app.admin.services.reconciliation_service import ReconciliationService

def run_acceptance_test():
    print("=" * 60)
    print("STARTING EYCMS FINANCIAL WORKFLOW ACCEPTANCE TEST")
    print("=" * 60)

    init_db()
    db = SessionLocal()

    try:
        # Get admin user
        admin = db.query(User).join(Role).filter(Role.name.in_(["SUPER_ADMIN", "ADMIN"])).first()
        if not admin:
            print("ERROR: No admin user found in DB.")
            return False

        # Clean up any leftover test data from previous runs for idempotency
        db.query(BankTransaction).filter(BankTransaction.bank_txn_id.in_(["BANK-TXN-5000", "BANK-TXN-2000"])).delete(synchronize_session=False)
        db.query(Transaction).filter(Transaction.description.ilike("%Conference Flight Booking%")).delete(synchronize_session=False)
        db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == "2026-05").delete(synchronize_session=False)
        db.commit()

        print(f"1. Admin user verified: {admin.name} ({admin.email})")

        # Test admin bill upload with real UploadFile
        mock_file = UploadFile(
            filename="sample_flight_bill.pdf",
            file=io.BytesIO(b"%PDF-1.4 Mock Flight Ticket PDF Content"),
        )

        txn_item = AdminTransactionCsvService.admin_upload_bill(
            db=db,
            file=mock_file,
            amount=5000.0,
            budget_line="Travel",
            vendor="Air India Ltd",
            description="Conference Flight Booking",
            grant_id=None,
            current_admin=admin,
            transaction_date=datetime(2026, 5, 15, tzinfo=timezone.utc),
        )

        print(f"-> Created Admin Txn ID: {txn_item.id}, Status: {txn_item.status}, Rec Status: {txn_item.reconciliation_status}")
        assert txn_item.amount == 5000.0
        assert txn_item.status == "ADMIN_RECORDED"
        assert txn_item.source == "ADMIN"

        # ----------------------------------------------------
        # Step 3: Confirm Txn appears in Admin Transactions
        # ----------------------------------------------------
        all_txns = AdminTransactionCsvService.list_transactions(db, search=txn_item.id)
        assert len(all_txns) >= 1
        print("-> Confirmed transaction appears in Admin Transactions list.")

        # ----------------------------------------------------
        # Step 4 & 5: Import & Confirm Bank CSV for ₹5,000
        # ----------------------------------------------------
        print("\nStep 4 & 5: Staging & Confirming Bank Statement CSV containing Rs. 5,000 transaction...")
        bank_csv_content = """date,description,reference_number,debit,credit,amount,bank_txn_id
2026-05-15,Air India Flight Booking Ref #9921,REF-9921,5000.00,0.00,5000.00,BANK-TXN-5000
"""
        stage_res = ReconciliationService.stage_import_bank_statement(
            db=db,
            file_bytes=bank_csv_content.encode("utf-8"),
            filename="bank_stmt_5000.csv",
            current_admin=admin,
        )
        assert stage_res.total_rows == 1
        assert stage_res.invalid_rows == 0
        print(f"-> Bank CSV Staged: Token {stage_res.stage_token[:10]}...")

        confirm_res = ReconciliationService.confirm_import_bank_statement(
            db=db,
            stage_token=stage_res.stage_token,
            period_name="2026-05",
            current_admin=admin,
        )
        assert confirm_res["imported"] == 1
        print("-> Bank CSV Confirmed & Inserted into bank_transactions table.")

        # ----------------------------------------------------
        # Step 6 & 7 & 8: Run Priority Auto Match
        # ----------------------------------------------------
        print("\nStep 6, 7 & 8: Running Priority Auto Match...")
        match_res = ReconciliationService.auto_match(db=db, period_name="2026-05", current_admin=admin)
        assert match_res.matched_count == 1
        print(f"-> Auto Match Complete: Matched {match_res.matched_count} transaction(s).")
        print(f"   Reason: {match_res.matches[0].match_reason}")

        # Verify relationship on both sides
        b_record = db.query(BankTransaction).filter(BankTransaction.bank_txn_id == "BANK-TXN-5000").first()
        l_record = db.query(Transaction).filter(Transaction.id == b_record.matched_transaction_id).first()

        assert b_record.match_status == "AUTO_MATCHED"
        assert str(l_record.bank_transaction_id) == str(b_record.id)
        assert l_record.reconciliation_status == "AUTO_MATCHED"
        print("-> VERIFIED: Both Bank Transaction and Ledger Transaction reflect relationship & AUTO_MATCHED status.")

        # ----------------------------------------------------
        # Step 9 & 10: Import unmatched ₹2,000 txn & create Journal Entry
        # ----------------------------------------------------
        print("\nStep 9 & 10: Importing unmatched Rs. 2,000 transaction & creating Journal Entry fallback...")
        bank_csv_2000 = """date,description,reference_number,debit,credit,amount,bank_txn_id
2026-05-18,Unbilled Local Taxi Fare,REF-TAXI-001,2000.00,0.00,2000.00,BANK-TXN-2000
"""
        stage_2000 = ReconciliationService.stage_import_bank_statement(
            db=db,
            file_bytes=bank_csv_2000.encode("utf-8"),
            filename="bank_stmt_2000.csv",
            current_admin=admin,
        )
        ReconciliationService.confirm_import_bank_statement(
            db=db,
            stage_token=stage_2000.stage_token,
            period_name="2026-05",
            current_admin=admin,
        )

        b_record_2000 = db.query(BankTransaction).filter(BankTransaction.bank_txn_id == "BANK-TXN-2000").first()
        jrn_res = ReconciliationService.create_journal_entry(
            db=db,
            bank_transaction_id=str(b_record_2000.id),
            debit_account="Travel",
            credit_account="Cash Account",
            amount=2000.0,
            narration="Emergency local taxi fare for project site visit.",
            current_admin=admin,
        )
        assert jrn_res["success"] is True
        print(f"-> Journal Entry Created successfully: Txn ID {jrn_res['transaction_id']}")
        db.refresh(b_record_2000)
        assert b_record_2000.match_status == "JOURNAL_ENTRY"

        # ----------------------------------------------------
        # Step 11 & 12 & 13: Confirm & Lock Reconciliation Period
        # ----------------------------------------------------
        print("\nStep 11, 12 & 13: Confirming and Locking period '2026-05'...")
        conf_period_res = ReconciliationService.confirm_period(db=db, period_name="2026-05", notes="Batch confirmed", current_admin=admin)
        assert conf_period_res["success"] is True
        print("-> Period 2026-05 Confirmed.")

        lock_res = ReconciliationService.lock_period(db=db, period_name="2026-05", notes="Month end lock", current_admin=admin)
        assert lock_res["success"] is True
        print("-> Period 2026-05 Locked.")

        # Verify read-only enforcement
        period_db = db.query(ReconciliationPeriod).filter(ReconciliationPeriod.period_name == "2026-05").first()
        assert period_db.status == "LOCKED"
        db.refresh(b_record)
        assert b_record.match_status == "LOCKED"
        db.refresh(l_record)
        assert l_record.status == "LOCKED"
        print("-> VERIFIED: Period, Bank Transaction, and Ledger Transaction are LOCKED and read-only.")

        # ----------------------------------------------------
        # Step 14 & 15: Unlock Period with mandatory reason & check audit log
        # ----------------------------------------------------
        print("\nStep 14 & 15: Unlocking Period with mandatory reason & verifying audit log...")
        unlock_reason = "Auditor requested additional document verification for May 2026."
        unlock_res = ReconciliationService.unlock_period(db=db, period_name="2026-05", reason=unlock_reason, current_admin=admin)
        assert unlock_res["success"] is True
        print("-> Period 2026-05 Unlocked.")

        audit_entry = db.query(AuditLog).filter(AuditLog.action == "PERIOD_UNLOCKED").order_by(AuditLog.created_at.desc()).first()
        assert audit_entry is not None
        assert unlock_reason in audit_entry.remarks
        print(f"-> VERIFIED Audit Log Entry created: Action='{audit_entry.action}', Remarks='{audit_entry.remarks}'")

        # ----------------------------------------------------
        # Step 16 & 17: CSV Exports
        # ----------------------------------------------------
        print("\nStep 16 & 17: Exporting Transactions CSV & Reconciliation CSV...")
        txns_csv = AdminTransactionCsvService.export_transactions(db=db, current_admin=admin)
        assert "Transaction ID" in txns_csv
        assert "Air India Ltd" in txns_csv

        rec_csv = ReconciliationService.export_reconciliation(db=db, period_name="2026-05", current_admin=admin)
        assert "Bank Transaction ID" in rec_csv
        assert "BANK-TXN-5000" in rec_csv
        print("-> VERIFIED: Both CSV exports generated with real backend data.")

        print("\n" + "=" * 60)
        print("ALL ACCEPTANCE TEST STEPS PASSED SUCCESSFULLY (100%)")
        print("=" * 60)
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = run_acceptance_test()
    if not success:
        sys.exit(1)
