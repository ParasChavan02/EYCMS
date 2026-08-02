from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.admin.schemas.uc import UCRecordCreate, UCRecordUpdate
from app.admin.services.uc_management import UCManagementService
from app.core.dependencies import get_db, require_admin_only
from app.common.models.user import User
from app.shared.responses import ResponseEnvelope, make_success_response
from pydantic import BaseModel

class SubmittedUCStatusUpdate(BaseModel):
    status: str
    admin_notes: str | None = None

router = APIRouter(prefix="/admin/uc", tags=["Admin UC Management"], dependencies=[Depends(require_admin_only)])


@router.get("/submitted", response_model=ResponseEnvelope[List[dict]])
def list_submitted_ucs(db: Session = Depends(get_db), current_admin: User = Depends(require_admin_only)):
    try:
        return make_success_response(UCManagementService.list_submitted_ucs(db, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch("/submitted/{uc_id}/status", response_model=ResponseEnvelope[dict])
def update_submitted_uc_status(
    uc_id: str,
    payload: SubmittedUCStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only)
):
    try:
        return make_success_response(
            UCManagementService.update_submitted_uc_status(
                db=db,
                uc_id=uc_id,
                status_val=payload.status,
                admin_notes=payload.admin_notes,
                current_user=current_admin
            )
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("", response_model=ResponseEnvelope[List[dict]])
def list_uc_records(db: Session = Depends(get_db), current_admin: User = Depends(require_admin_only)):
    try:
        return make_success_response(UCManagementService.list_uc_records(db, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("", response_model=ResponseEnvelope[dict])
def create_uc_record(
    payload: UCRecordCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only),
):
    try:
        return make_success_response(UCManagementService.create_uc_record(db, payload, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{record_id}", response_model=ResponseEnvelope[dict])
def get_uc_record(record_id: str, db: Session = Depends(get_db), current_admin: User = Depends(require_admin_only)):
    try:
        return make_success_response(UCManagementService.get_uc_record(db, record_id, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.put("/{record_id}", response_model=ResponseEnvelope[dict])
def update_uc_record(
    record_id: str,
    payload: UCRecordUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only),
):
    try:
        return make_success_response(UCManagementService.update_uc_record(db, record_id, payload, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{record_id}/submit", response_model=ResponseEnvelope[dict])
def submit_uc_record(record_id: str, db: Session = Depends(get_db), current_admin: User = Depends(require_admin_only)):
    try:
        return make_success_response(UCManagementService.submit_uc_record(db, record_id, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{record_id}/versions", response_model=ResponseEnvelope[List[dict]])
def list_uc_versions(record_id: str, db: Session = Depends(get_db), current_admin: User = Depends(require_admin_only)):
    try:
        return make_success_response(UCManagementService.list_versions(db, record_id, current_admin))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{record_id}/supporting-documents", response_model=ResponseEnvelope[dict])
async def upload_supporting_document(
    record_id: str,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only),
):
    try:
        return make_success_response(
            UCManagementService.upload_supporting_document(db, record_id, current_admin, document_type, file)
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/{record_id}/generated-pdf", response_model=ResponseEnvelope[dict])
async def upload_generated_pdf(
    record_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin_only),
):
    try:
        return make_success_response(UCManagementService.attach_generated_pdf(db, record_id, current_admin, file))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{record_id}/download")
def download_generated_pdf(record_id: str, db: Session = Depends(get_db), current_admin: User = Depends(require_admin_only)):
    try:
        record = UCManagementService.get_uc_record(db, record_id, current_admin)
        pdf_path = record.get("generated_pdf_path")
        if not pdf_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated PDF not found.")
        return FileResponse(pdf_path, filename=record.get("generated_pdf_file_name") or "official_uc.pdf")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
