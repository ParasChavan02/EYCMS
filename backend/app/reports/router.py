from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.dependencies import get_db, get_current_user
from app.common.models.user import User
from app.reports.schemas import ProjectFileResponse, ProjectFileStatusUpdate
from app.reports.services import ReportService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/reports", tags=["Reports & Document Management"], dependencies=[Depends(get_current_user)])

@router.post("/upload", response_model=ResponseEnvelope[ProjectFileResponse])
async def upload_file(
    category: str = Form("document"),
    event_name: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        file_resp = await ReportService.upload_file(
            db=db,
            user=current_user,
            category=category,
            upload_file=file,
            event_name=event_name
        )
        return make_success_response(file_resp)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/team-files", response_model=ResponseEnvelope[List[ProjectFileResponse]])
def get_team_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        files = ReportService.list_team_files(db, current_user)
        return make_success_response(files)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/admin-files", response_model=ResponseEnvelope[List[ProjectFileResponse]])
def get_admin_files(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        files = ReportService.list_all_files_for_admin(
            db=db,
            current_user=current_user,
            category=category,
            status_filter=status_filter,
            search=search
        )
        return make_success_response(files)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/gallery-images", response_model=ResponseEnvelope[List[ProjectFileResponse]])
def get_gallery_images(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        images = ReportService.list_gallery_images(db, search=search)
        return make_success_response(images)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/files/{file_id}/status", response_model=ResponseEnvelope[ProjectFileResponse])
def update_file_status(
    file_id: str,
    payload: ProjectFileStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        file_resp = ReportService.update_file_status(
            db=db,
            file_id=file_id,
            status_val=payload.status,
            admin_notes=payload.admin_notes,
            current_user=current_user
        )
        return make_success_response(file_resp)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/files/{file_id}", response_model=ResponseEnvelope[dict])
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        res = ReportService.delete_file(db, file_id, current_user)
        return make_success_response(res)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
