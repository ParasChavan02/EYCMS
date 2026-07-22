import os
import uuid
import shutil
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import UploadFile, HTTPException, status
from app.common.models.project_file import ProjectFile
from app.common.models.user import User
from app.common.constants.enums import RoleEnum
from app.notifications.services.notification_service import NotificationService
from app.reports.schemas import ProjectFileResponse, ProjectFileStatusUpdate

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB restriction

CATEGORY_FOLDERS = {
    "report": "uploads/reports",
    "bill": "uploads/bills",
    "image": "uploads/images",
    "document": "uploads/other_documents",
    "uc": "uploads/uc"
}

class ReportService:
    @staticmethod
    def _to_response(file_obj: ProjectFile, db: Optional[Session] = None) -> ProjectFileResponse:
        uploader = file_obj.uploader
        if not uploader and db and file_obj.uploaded_by_id:
            try:
                uploader = db.query(User).filter(User.id == file_obj.uploaded_by_id).first()
            except Exception:
                uploader = None

        uploader_name = uploader.name if uploader and uploader.name else "Team Member"
        uploader_email = uploader.email if uploader and uploader.email else ""
        
        # Build normalized web-accessible URL
        clean_path = file_obj.file_path.replace("\\", "/")
        if not clean_path.startswith("/"):
            clean_path = "/" + clean_path

        from datetime import datetime, timezone
        if file_obj.created_at:
            dt_created = file_obj.created_at
            if dt_created.tzinfo is None:
                dt_created = dt_created.replace(tzinfo=timezone.utc)
            created_str = dt_created.isoformat()
        else:
            created_str = datetime.now(timezone.utc).isoformat()

        if file_obj.updated_at:
            dt_updated = file_obj.updated_at
            if dt_updated.tzinfo is None:
                dt_updated = dt_updated.replace(tzinfo=timezone.utc)
            updated_str = dt_updated.isoformat()
        else:
            updated_str = created_str

        return ProjectFileResponse(
            id=str(file_obj.id),
            project_id=str(file_obj.project_id) if file_obj.project_id else None,
            team_id=str(file_obj.team_id) if file_obj.team_id else None,
            uploaded_by_id=str(file_obj.uploaded_by_id),
            uploaded_by_name=uploader_name,
            uploaded_by_email=uploader_email,
            category=file_obj.category,
            file_name=file_obj.file_name,
            original_file_name=file_obj.original_file_name,
            file_path=file_obj.file_path,
            file_size=file_obj.file_size if file_obj.file_size is not None else 0,
            mime_type=file_obj.mime_type,
            event_name=file_obj.event_name,
            status=file_obj.status,
            admin_notes=file_obj.admin_notes,
            created_at=created_str,
            updated_at=updated_str,
            url=clean_path
        )

    @staticmethod
    async def upload_file(
        db: Session,
        user: User,
        category: str,
        upload_file: UploadFile,
        event_name: Optional[str] = None
    ) -> ProjectFileResponse:
        category = category.lower().strip()
        if category not in CATEGORY_FOLDERS:
            category = "document"

        target_dir = CATEGORY_FOLDERS.get(category, "uploads/documents")
        os.makedirs(target_dir, exist_ok=True)

        # Read file contents & check size restriction
        contents = await upload_file.read()
        file_size = len(contents)

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{upload_file.filename}' exceeds the maximum allowed size of 20 MB."
            )

        # Generate unique filename on disk
        file_ext = os.path.splitext(upload_file.filename)[1].lower()
        unique_name = f"{uuid.uuid4().hex[:10]}_{upload_file.filename}"
        disk_path = os.path.join(target_dir, unique_name)

        # Write file to disk
        with open(disk_path, "wb") as f:
            f.write(contents)

        # Create database record
        # Approval is ONLY required for report, bill, and uc. Images and documents do not require approval.
        initial_status = "PENDING" if category in ["report", "bill", "uc"] else "APPROVED"

        relative_path = disk_path.replace("\\", "/")
        from datetime import datetime, timezone
        now_utc = datetime.now(timezone.utc)
        project_file = ProjectFile(
            project_id=user.project_id,
            team_id=user.team_id,
            uploaded_by_id=user.id,
            category=category,
            file_name=unique_name,
            original_file_name=upload_file.filename,
            file_path=relative_path,
            file_size=file_size,
            mime_type=upload_file.content_type,
            event_name=event_name,
            status=initial_status,
            created_at=now_utc,
            updated_at=now_utc
        )

        db.add(project_file)
        db.commit()
        db.refresh(project_file)

        # Trigger real-time notifications for Admin & Accounts roles
        roles_to_notify = [RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value]
        if category in ["bill", "uc"]:
            roles_to_notify.append(RoleEnum.ACCOUNTS.value)

        NotificationService.broadcast_notification(
            db=db,
            title=f"New {category.upper()} Uploaded",
            message=f"{user.name} uploaded {category}: '{upload_file.filename}'",
            type="info",
            roles=roles_to_notify,
            action_path="/admin/reports",
            action_label="Review upload"
        )

        return ReportService._to_response(project_file, db)

    @staticmethod
    def list_team_files(db: Session, user: User) -> List[ProjectFileResponse]:
        """
        Retrieves all files belonging to the current user's project/team
        so every team member can view shared project files with uploader names.
        """
        filters = []
        if user.project_id:
            filters.append(ProjectFile.project_id == user.project_id)
        if user.team_id:
            filters.append(ProjectFile.team_id == user.team_id)
        filters.append(ProjectFile.uploaded_by_id == user.id)

        files = db.query(ProjectFile).filter(or_(*filters)).order_by(ProjectFile.created_at.desc()).all()
        return [ReportService._to_response(f, db) for f in files]

    @staticmethod
    def list_all_files_for_admin(
        db: Session,
        current_user: User,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[ProjectFileResponse]:
        """
        Lists files for Admin / Finance.
        Finance users can ONLY access 'bill' and 'uc' categories.
        """
        user_role = current_user.role.name.upper() if current_user.role else ""
        query = db.query(ProjectFile)

        # Role-based restriction: Finance (Accounts) gets Bills & UC only
        if user_role == RoleEnum.ACCOUNTS.value:
            query = query.filter(ProjectFile.category.in_(["bill", "uc"]))

        if category and category.lower() != "all":
            query = query.filter(ProjectFile.category == category.lower())

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(ProjectFile.status == status_filter.upper())

        if search:
            s = f"%{search}%"
            query = query.join(User, ProjectFile.uploaded_by_id == User.id).filter(
                or_(
                    ProjectFile.original_file_name.like(s),
                    ProjectFile.event_name.like(s),
                    User.name.like(s)
                )
            )

        files = query.order_by(ProjectFile.created_at.desc()).all()
        return [ReportService._to_response(f, db) for f in files]

    @staticmethod
    def list_gallery_images(
        db: Session,
        search: Optional[str] = None
    ) -> List[ProjectFileResponse]:
        """
        Fetch all event images for Admin Gallery Module in real time.
        """
        query = db.query(ProjectFile).filter(ProjectFile.category == "image")

        if search:
            s = f"%{search}%"
            query = query.join(User, ProjectFile.uploaded_by_id == User.id).filter(
                or_(
                    ProjectFile.original_file_name.like(s),
                    ProjectFile.event_name.like(s),
                    User.name.like(s)
                )
            )

        images = query.order_by(ProjectFile.created_at.desc()).all()
        return [ReportService._to_response(img, db) for img in images]

    @staticmethod
    def update_file_status(
        db: Session,
        file_id: str,
        status_val: str,
        admin_notes: Optional[str],
        current_user: User
    ) -> ProjectFileResponse:
        user_role = current_user.role.name.upper() if current_user.role else ""

        # Accounts is a read-only role: it can view bills/UCs via /reports/admin-files
        # but must never be able to approve/reject/modify them.
        if user_role == RoleEnum.ACCOUNTS.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accounts role has read-only access and cannot update file status."
            )

        file_obj = db.query(ProjectFile).filter(ProjectFile.id == uuid.UUID(file_id)).first()
        if not file_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        file_obj.status = status_val.upper()
        if admin_notes:
            file_obj.admin_notes = admin_notes

        db.commit()
        db.refresh(file_obj)

        # Notify the uploader
        NotificationService.create_notification(
            db=db,
            user_id=str(file_obj.uploaded_by_id),
            title=f"File {file_obj.status}: {file_obj.original_file_name}",
            message=f"Your uploaded {file_obj.category} '{file_obj.original_file_name}' has been {file_obj.status.lower()}.",
            type="success" if file_obj.status == "APPROVED" else "error",
            action_path="/reports",
            action_label="View Reports"
        )

        return ReportService._to_response(file_obj)

    @staticmethod
    def delete_file(db: Session, file_id: str, user: User) -> dict:
        user_role = user.role.name.upper() if user.role else ""

        # Accounts is a read-only role and must never be able to delete files.
        if user_role == RoleEnum.ACCOUNTS.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accounts role has read-only access and cannot delete files."
            )

        file_obj = db.query(ProjectFile).filter(ProjectFile.id == uuid.UUID(file_id)).first()
        if not file_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        is_owner = str(file_obj.uploaded_by_id) == str(user.id)
        is_admin = user_role in [RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value]

        if not is_owner and not is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        if is_owner and file_obj.status == "APPROVED" and not is_admin:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete an approved file.")

        # Remove file from disk
        if os.path.exists(file_obj.file_path):
            try:
                os.remove(file_obj.file_path)
            except Exception as e:
                print("Failed to remove file from disk:", e)

        db.delete(file_obj)
        db.commit()

        return {"message": "File deleted successfully"}
