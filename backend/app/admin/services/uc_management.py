from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.admin.schemas.uc import (
    UCCommittedExpenditureRowIn,
    UCCapitalAssetIn,
    UCFinancialSummaryIn,
    UCManpowerDetailIn,
    UCRecordCreate,
    UCRecordResponse,
    UCRecordUpdate,
    UCSupportingDocumentUploadResponse,
    UCVersionHistoryResponse,
)
from app.common.constants.enums import RoleEnum
from app.common.models.uc_management import (
    UCCommittedExpenditureRow,
    UCCapitalAsset,
    UCFinancialSummary,
    UCManpowerDetail,
    UCRecord,
    UCStatementOfExpenditureRow,
    UCSupportingDocument,
    UCVersionHistory,
)
from app.common.models.user import User
from app.core.config import settings


ALLOWED_UC_STATUSES = {"DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "REVISION_REQUESTED"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value or 0)).quantize(Decimal("0.01"))
    except Exception:
        return Decimal("0.00")


def _ensure_admin_only(current_user: User) -> None:
    role = current_user.role.name.upper() if current_user.role else ""
    if role != RoleEnum.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Admin users can manage official UCs.")


def _build_snapshot(record: UCRecord) -> dict:
    return {
        "id": str(record.id),
        "project_id": str(record.project_id) if record.project_id else None,
        "reference_no": record.reference_no,
        "project_title": record.project_title,
        "organization": record.organization,
        "project_coordinator": record.project_coordinator,
        "sanction_order_no": record.sanction_order_no,
        "project_start_date": record.project_start_date.isoformat() if record.project_start_date else None,
        "project_end_date": record.project_end_date.isoformat() if record.project_end_date else None,
        "bank_account_number": record.bank_account_number,
        "financial_year": record.financial_year,
        "reporting_period_from": record.reporting_period_from.isoformat() if record.reporting_period_from else None,
        "reporting_period_to": record.reporting_period_to.isoformat() if record.reporting_period_to else None,
        "status": record.status,
        "version": record.version,
        "notes": record.notes,
        "financial_summary": _financial_to_dict(record.financial_summary),
        "soe_rows": [_soe_to_dict(row) for row in record.soe_rows],
        "committed_rows": [_committed_to_dict(row) for row in record.committed_rows],
        "capital_assets": [_asset_to_dict(row) for row in record.capital_assets],
        "manpower_details": [_manpower_to_dict(row) for row in record.manpower_details],
    }


def _financial_to_dict(summary: UCFinancialSummary | None) -> dict:
    if not summary:
        return {}
    return {
        "opening_balance": float(summary.opening_balance or 0),
        "grant_received": float(summary.grant_received or 0),
        "interest_earned": float(summary.interest_earned or 0),
        "other_receipts": float(summary.other_receipts or 0),
        "total_available_funds": float(summary.total_available_funds or 0),
        "actual_expenditure": float(summary.actual_expenditure or 0),
        "refunded_amount": float(summary.refunded_amount or 0),
        "closing_balance": float(summary.closing_balance or 0),
        "amount_carried_forward": float(summary.amount_carried_forward or 0),
    }


def _soe_to_dict(row: UCStatementOfExpenditureRow) -> dict:
    return {
        "head": row.head,
        "opening_balance": float(row.opening_balance or 0),
        "grant_received": float(row.grant_received or 0),
        "total_available": float(row.total_available or 0),
        "actual_expenditure": float(row.actual_expenditure or 0),
        "balance": float(row.balance or 0),
        "remarks": row.remarks,
        "sort_order": row.sort_order,
    }


def _committed_to_dict(row: UCCommittedExpenditureRow) -> dict:
    return {
        "head_of_expenditure": row.head_of_expenditure,
        "particulars": row.particulars,
        "tentative_amount": float(row.tentative_amount or 0),
        "contribution": float(row.contribution or 0),
        "expected_expenditure_date": row.expected_expenditure_date.isoformat() if row.expected_expenditure_date else None,
        "sort_order": row.sort_order,
    }


def _asset_to_dict(row: UCCapitalAsset) -> dict:
    return {
        "item": row.item,
        "budget_cost": float(row.budget_cost or 0),
        "actual_cost": float(row.actual_cost or 0),
        "contribution": float(row.contribution or 0),
        "procurement_date": row.procurement_date.isoformat() if row.procurement_date else None,
        "insurance_period": row.insurance_period,
        "insurance_amount": float(row.insurance_amount or 0),
        "beneficiary": row.beneficiary,
        "sort_order": row.sort_order,
    }


def _manpower_to_dict(row: UCManpowerDetail) -> dict:
    return {
        "employee_name": row.employee_name,
        "qualification": row.qualification,
        "designation": row.designation,
        "joining_date": row.joining_date.isoformat() if row.joining_date else None,
        "salary_period": row.salary_period,
        "monthly_salary": float(row.monthly_salary or 0),
        "total_paid": float(row.total_paid or 0),
        "sort_order": row.sort_order,
    }


def _version_to_dict(version: UCVersionHistory) -> dict:
    return {
        "id": str(version.id),
        "version_number": version.version_number,
        "change_note": version.change_note,
        "created_at": version.created_at,
        "changed_by_name": version.changer.name if version.changer else None,
    }


def _response_for(record: UCRecord) -> dict:
    return UCRecordResponse(
        id=str(record.id),
        project_id=str(record.project_id) if record.project_id else None,
        reference_no=record.reference_no,
        project_title=record.project_title,
        organization=record.organization,
        project_coordinator=record.project_coordinator,
        sanction_order_no=record.sanction_order_no,
        project_start_date=record.project_start_date,
        project_end_date=record.project_end_date,
        bank_account_number=record.bank_account_number,
        financial_year=record.financial_year,
        reporting_period_from=record.reporting_period_from,
        reporting_period_to=record.reporting_period_to,
        status=record.status,
        version=record.version,
        generated_pdf_file_name=record.generated_pdf_file_name,
        generated_pdf_path=record.generated_pdf_path,
        notes=record.notes,
        submitted_at=record.submitted_at,
        created_at=record.created_at,
        updated_at=record.updated_at,
        financial_summary=UCFinancialSummaryIn(**_financial_to_dict(record.financial_summary)),
        soe_rows=[UCStatementOfExpenditureRowIn(**_soe_to_dict(row)) for row in record.soe_rows],
        committed_rows=[UCCommittedExpenditureRowIn(**_committed_to_dict(row)) for row in record.committed_rows],
        capital_assets=[UCCapitalAssetIn(**_asset_to_dict(row)) for row in record.capital_assets],
        manpower_details=[UCManpowerDetailIn(**_manpower_to_dict(row)) for row in record.manpower_details],
        supporting_documents=[
            UCSupportingDocumentUploadResponse(
                id=str(doc.id),
                uc_record_id=str(doc.uc_record_id),
                file_name=doc.file_name,
                original_file_name=doc.original_file_name,
                file_path=doc.file_path,
                document_type=doc.document_type,
                file_size=doc.file_size,
                created_at=doc.created_at,
            )
            for doc in record.supporting_documents
        ],
        versions=[UCVersionHistoryResponse(**_version_to_dict(v)) for v in record.versions],
    ).model_dump()


def _replace_children(record: UCRecord, payload: UCRecordCreate | UCRecordUpdate) -> None:
    if getattr(payload, "financial_summary", None) is not None:
        if record.financial_summary is None:
            record.financial_summary = UCFinancialSummary()
        financial = payload.financial_summary
        record.financial_summary.opening_balance = _decimal(financial.opening_balance)
        record.financial_summary.grant_received = _decimal(financial.grant_received)
        record.financial_summary.interest_earned = _decimal(financial.interest_earned)
        record.financial_summary.other_receipts = _decimal(financial.other_receipts)
        record.financial_summary.total_available_funds = _decimal(financial.total_available_funds)
        record.financial_summary.actual_expenditure = _decimal(financial.actual_expenditure)
        record.financial_summary.refunded_amount = _decimal(financial.refunded_amount)
        record.financial_summary.closing_balance = _decimal(financial.closing_balance)
        record.financial_summary.amount_carried_forward = _decimal(financial.amount_carried_forward)

    if getattr(payload, "soe_rows", None) is not None:
        record.soe_rows = [
            UCStatementOfExpenditureRow(
                head=row.head,
                opening_balance=_decimal(row.opening_balance),
                grant_received=_decimal(row.grant_received),
                total_available=_decimal(row.total_available),
                actual_expenditure=_decimal(row.actual_expenditure),
                balance=_decimal(row.balance),
                remarks=row.remarks,
                sort_order=row.sort_order,
            )
            for row in payload.soe_rows
        ]

    if getattr(payload, "committed_rows", None) is not None:
        record.committed_rows = [
            UCCommittedExpenditureRow(
                head_of_expenditure=row.head_of_expenditure,
                particulars=row.particulars,
                tentative_amount=_decimal(row.tentative_amount),
                contribution=_decimal(row.contribution),
                expected_expenditure_date=row.expected_expenditure_date,
                sort_order=row.sort_order,
            )
            for row in payload.committed_rows
        ]

    if getattr(payload, "capital_assets", None) is not None:
        record.capital_assets = [
            UCCapitalAsset(
                item=row.item,
                budget_cost=_decimal(row.budget_cost),
                actual_cost=_decimal(row.actual_cost),
                contribution=_decimal(row.contribution),
                procurement_date=row.procurement_date,
                insurance_period=row.insurance_period,
                insurance_amount=_decimal(row.insurance_amount),
                beneficiary=row.beneficiary,
                sort_order=row.sort_order,
            )
            for row in payload.capital_assets
        ]

    if getattr(payload, "manpower_details", None) is not None:
        record.manpower_details = [
            UCManpowerDetail(
                employee_name=row.employee_name,
                qualification=row.qualification,
                designation=row.designation,
                joining_date=row.joining_date,
                salary_period=row.salary_period,
                monthly_salary=_decimal(row.monthly_salary),
                total_paid=_decimal(row.total_paid),
                sort_order=row.sort_order,
            )
            for row in payload.manpower_details
        ]


def _touch_version(db: Session, record: UCRecord, changed_by: User, change_note: Optional[str], bump: bool = True) -> None:
    if bump:
        record.version = int(record.version or 0) + 1
    if not record.version:
        record.version = 1
    snapshot = _build_snapshot(record)
    db.add(
        UCVersionHistory(
            uc_record=record,
            version_number=record.version,
            snapshot=json.dumps(snapshot, default=str),
            change_note=change_note,
            changed_by_id=changed_by.id,
        )
    )


def _validate_submission(record: UCRecord) -> None:
    required_errors: list[str] = []
    for field_name in [
        "reference_no",
        "project_title",
        "organization",
        "project_coordinator",
        "sanction_order_no",
        "bank_account_number",
        "financial_year",
    ]:
        if not getattr(record, field_name):
            required_errors.append(field_name.replace("_", " ").title())

    if not record.financial_summary:
        required_errors.append("Financial Summary")

    if not record.soe_rows:
        required_errors.append("Statement of Expenditure rows")

    if required_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Missing mandatory UC fields", "missing": required_errors},
        )


class UCManagementService:
    @staticmethod
    def list_uc_records(db: Session, current_user: User) -> List[dict]:
        _ensure_admin_only(current_user)
        records = (
            db.query(UCRecord)
            .options(
                joinedload(UCRecord.financial_summary),
                joinedload(UCRecord.soe_rows),
                joinedload(UCRecord.committed_rows),
                joinedload(UCRecord.capital_assets),
                joinedload(UCRecord.manpower_details),
                joinedload(UCRecord.supporting_documents),
                joinedload(UCRecord.versions).joinedload(UCVersionHistory.changer),
            )
            .order_by(UCRecord.updated_at.desc())
            .all()
        )
        return [_response_for(record) for record in records]

    @staticmethod
    def get_uc_record(db: Session, record_id: str, current_user: User) -> dict:
        _ensure_admin_only(current_user)
        record = UCManagementService._get_record(db, record_id)
        return _response_for(record)

    @staticmethod
    def create_uc_record(db: Session, payload: UCRecordCreate, current_user: User) -> dict:
        _ensure_admin_only(current_user)
        now = _now()
        record = UCRecord(
            project_id=uuid.UUID(payload.project_id) if payload.project_id else None,
            created_by_id=current_user.id,
            updated_by_id=current_user.id,
            reference_no=payload.reference_no.strip(),
            project_title=payload.project_title.strip(),
            organization=payload.organization.strip(),
            project_coordinator=payload.project_coordinator.strip(),
            sanction_order_no=payload.sanction_order_no.strip(),
            project_start_date=payload.project_start_date,
            project_end_date=payload.project_end_date,
            bank_account_number=payload.bank_account_number.strip(),
            financial_year=payload.financial_year.strip(),
            reporting_period_from=payload.reporting_period_from,
            reporting_period_to=payload.reporting_period_to,
            status="DRAFT",
            notes=payload.notes,
            submitted_at=None,
            created_at=now,
            updated_at=now,
        )
        db.add(record)
        db.flush()
        _replace_children(record, payload)
        record.financial_summary.uc_record = record
        _touch_version(db, record, current_user, "Created draft UC", bump=False)
        db.commit()
        db.refresh(record)
        return UCManagementService.get_uc_record(db, str(record.id), current_user)

    @staticmethod
    def update_uc_record(db: Session, record_id: str, payload: UCRecordUpdate, current_user: User) -> dict:
        _ensure_admin_only(current_user)
        record = UCManagementService._get_record(db, record_id)
        if record.status not in {"DRAFT", "REVISION_REQUESTED"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only draft or revision-requested UCs can be edited.")

        for field_name in [
            "reference_no",
            "project_title",
            "organization",
            "project_coordinator",
            "sanction_order_no",
            "bank_account_number",
            "financial_year",
            "project_start_date",
            "project_end_date",
            "reporting_period_from",
            "reporting_period_to",
            "notes",
        ]:
            value = getattr(payload, field_name)
            if value is not None:
                setattr(record, field_name, value.strip() if isinstance(value, str) else value)

        if payload.project_id is not None:
            record.project_id = uuid.UUID(payload.project_id) if payload.project_id else None

        if payload.financial_summary is not None:
            _replace_children(record, payload)
        else:
            _replace_children(record, payload)

        record.updated_by_id = current_user.id
        _touch_version(db, record, current_user, payload.change_note or "Updated UC draft", bump=True)
        db.commit()
        db.refresh(record)
        return UCManagementService.get_uc_record(db, str(record.id), current_user)

    @staticmethod
    def submit_uc_record(db: Session, record_id: str, current_user: User) -> dict:
        _ensure_admin_only(current_user)
        record = UCManagementService._get_record(db, record_id)
        _validate_submission(record)

        if not record.generated_pdf_path:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Generate and upload the official PDF before submission.")

        record.status = "SUBMITTED"
        record.submitted_by_id = current_user.id
        record.updated_by_id = current_user.id
        record.submitted_at = _now()
        _touch_version(db, record, current_user, "Submitted official UC", bump=True)
        db.commit()
        db.refresh(record)
        return UCManagementService.get_uc_record(db, str(record.id), current_user)

    @staticmethod
    def upload_supporting_document(
        db: Session,
        record_id: str,
        current_user: User,
        document_type: str,
        upload_file: UploadFile,
    ) -> dict:
        _ensure_admin_only(current_user)
        record = UCManagementService._get_record(db, record_id)
        base_dir = os.path.join(settings.UPLOAD_DIR_UC, str(record.id), "supporting")
        os.makedirs(base_dir, exist_ok=True)

        safe_name = f"{uuid.uuid4().hex[:12]}_{upload_file.filename or 'attachment'}"
        disk_path = os.path.join(base_dir, safe_name)
        contents = upload_file.file.read()
        with open(disk_path, "wb") as handle:
            handle.write(contents)

        doc = UCSupportingDocument(
            uc_record=record,
            file_name=safe_name,
            original_file_name=upload_file.filename or safe_name,
            file_path=disk_path.replace("\\", "/"),
            document_type=document_type,
            file_size=len(contents),
            uploaded_by_id=current_user.id,
        )
        db.add(doc)
        _touch_version(db, record, current_user, f"Uploaded supporting document: {upload_file.filename or safe_name}", bump=True)
        db.commit()
        db.refresh(doc)
        return {
            "id": str(doc.id),
            "uc_record_id": str(doc.uc_record_id),
            "file_name": doc.file_name,
            "original_file_name": doc.original_file_name,
            "file_path": doc.file_path,
            "document_type": doc.document_type,
            "file_size": doc.file_size,
            "created_at": doc.created_at,
        }

    @staticmethod
    def attach_generated_pdf(
        db: Session,
        record_id: str,
        current_user: User,
        upload_file: UploadFile,
    ) -> dict:
        _ensure_admin_only(current_user)
        record = UCManagementService._get_record(db, record_id)
        base_dir = os.path.join(settings.UPLOAD_DIR_UC, str(record.id), "generated")
        os.makedirs(base_dir, exist_ok=True)

        safe_name = f"UC_{record.reference_no.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pdf"
        disk_path = os.path.join(base_dir, safe_name)
        contents = upload_file.file.read()
        with open(disk_path, "wb") as handle:
            handle.write(contents)

        record.generated_pdf_file_name = upload_file.filename or safe_name
        record.generated_pdf_path = disk_path.replace("\\", "/")
        record.updated_by_id = current_user.id
        _touch_version(db, record, current_user, "Generated official PDF", bump=True)
        db.commit()
        db.refresh(record)
        return UCManagementService.get_uc_record(db, str(record.id), current_user)

    @staticmethod
    def list_versions(db: Session, record_id: str, current_user: User) -> List[dict]:
        _ensure_admin_only(current_user)
        record = UCManagementService._get_record(db, record_id)
        return [_version_to_dict(version) for version in record.versions]

    def list_submitted_ucs(db: Session, current_user: User) -> List[dict]:
        _ensure_admin_only(current_user)
        import uuid
        from app.common.models.utilization_certificate import UtilizationCertificate
        from app.common.models.project_file import ProjectFile
        from app.common.models.project import Project
        
        ucs = (
            db.query(UtilizationCertificate)
            .join(Project, Project.id == UtilizationCertificate.project_id)
            .join(ProjectFile, ProjectFile.id == UtilizationCertificate.file_id)
            .join(User, User.id == UtilizationCertificate.uploaded_by_id)
            .all()
        )
        
        results = []
        for uc in ucs:
            results.append({
                "id": str(uc.id),
                "project_id": str(uc.project_id),
                "project_title": uc.project.title if uc.project else "N/A",
                "file_id": str(uc.file_id),
                "file_name": uc.uploaded_file.file_name if uc.uploaded_file else "N/A",
                "original_file_name": uc.uploaded_file.original_file_name if uc.uploaded_file else "N/A",
                "file_path": uc.uploaded_file.file_path if uc.uploaded_file else "N/A",
                "mime_type": uc.uploaded_file.mime_type if uc.uploaded_file else "N/A",
                "uploaded_by_id": str(uc.uploaded_by_id),
                "uploaded_by_name": uc.uploader.full_name if uc.uploader else "N/A",
                "uploaded_by_email": uc.uploader.email if uc.uploader else "N/A",
                "reporting_period": uc.reporting_period or "N/A",
                "version": uc.version,
                "status": uc.status,
                "admin_notes": uc.admin_notes or "",
                "created_at": uc.created_at.isoformat() if uc.created_at else None,
                "updated_at": uc.updated_at.isoformat() if uc.updated_at else None,
            })
        return results

    @staticmethod
    def update_submitted_uc_status(db: Session, uc_id: str, status_val: str, admin_notes: str | None, current_user: User) -> dict:
        _ensure_admin_only(current_user)
        import uuid
        from app.common.models.utilization_certificate import UtilizationCertificate
        from app.common.models.project_file import ProjectFile
        
        uc = db.query(UtilizationCertificate).filter(UtilizationCertificate.id == uuid.UUID(uc_id)).first()
        if not uc:
            raise HTTPException(status_code=404, detail="Submitted UC not found")
        
        old_status = uc.status
        uc.status = status_val.upper()
        if admin_notes is not None:
            uc.admin_notes = admin_notes
        
        if uc.uploaded_file:
            uc.uploaded_file.status = status_val.upper()
            if admin_notes is not None:
                uc.uploaded_file.admin_notes = admin_notes
        
        db.commit()
        db.refresh(uc)
        
        from app.notifications.services.notification_service import NotificationService
        from app.common.models.audit_log import AuditLog
        
        NotificationService.create_notification(
            db=db,
            user_id=str(uc.uploaded_by_id),
            title=f"UC {status_val.capitalize()}",
            message=f"Your Utilization Certificate version {uc.version} has been {status_val.lower()}.",
            type="success" if status_val == "APPROVED" else "error" if status_val == "REJECTED" else "info",
            action_path="/reports",
            action_label="View Reports"
        )
        
        audit = AuditLog(
            user_id=current_user.id,
            action="UC_STATUS_UPDATE",
            entity="UtilizationCertificate",
            remarks=f"Admin updated UC status for project {uc.project_id} (Version {uc.version}) from {old_status} to {status_val.upper()}."
        )
        db.add(audit)
        db.commit()
        
        return {
            "id": str(uc.id),
            "status": uc.status,
            "admin_notes": uc.admin_notes
        }

    @staticmethod
    def _get_record(db: Session, record_id: str) -> UCRecord:
        try:
            record_uuid = uuid.UUID(record_id)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UC record id.") from exc

        record = (
            db.query(UCRecord)
            .options(
                joinedload(UCRecord.financial_summary),
                joinedload(UCRecord.soe_rows),
                joinedload(UCRecord.committed_rows),
                joinedload(UCRecord.capital_assets),
                joinedload(UCRecord.manpower_details),
                joinedload(UCRecord.supporting_documents),
                joinedload(UCRecord.versions).joinedload(UCVersionHistory.changer),
            )
            .filter(UCRecord.id == record_uuid)
            .first()
        )
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="UC record not found.")
        return record
