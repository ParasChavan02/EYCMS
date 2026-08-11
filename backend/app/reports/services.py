import os
import uuid
import shutil
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from fastapi import UploadFile, HTTPException, status
from decimal import Decimal
from app.common.models.project_file import ProjectFile
from app.common.models.user import User
from app.common.constants.enums import RoleEnum
from app.notifications.services.notification_service import NotificationService
from app.reports.schemas import ProjectFileResponse, ProjectFileStatusUpdate

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB restriction

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

        # Fetch associated transactions if it's a bill
        transactions_list = []
        if file_obj.category == "bill" and db:
            try:
                from app.common.models.transaction import Transaction
                from app.reports.schemas import BillTransactionResponse
                txs = db.query(Transaction).filter(Transaction.bill_id == file_obj.id).all()
                transactions_list = [
                    BillTransactionResponse(
                        id=str(t.id),
                        amount=float(t.amount),
                        description=t.description,
                        category=t.category or "",
                        status=t.status
                    ) for t in txs
                ]
            except Exception as e:
                print("Failed to fetch transactions for bill response:", e)

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
            url=clean_path,
            transactions=transactions_list
        )

    @staticmethod
    async def upload_file(
        db: Session,
        user: User,
        category: str,
        upload_file: Optional[UploadFile] = None,
        event_name: Optional[str] = None,
        bill_amount: Optional[float] = None,
        transaction_mode: Optional[str] = None,
        transactions_json: Optional[str] = None,
        status_val: Optional[str] = None,
        bill_id: Optional[str] = None
    ) -> ProjectFileResponse:
        category = category.lower().strip()
        if category not in CATEGORY_FOLDERS:
            category = "document"

        project_id = user.project_id
        team_id = user.team_id

        # Admin fallback logic: Admins don't have project_id/team_id, so select first project
        if not project_id:
            from app.common.models.project import Project
            from app.common.models.team import Team
            first_proj = db.query(Project).first()
            if first_proj:
                project_id = first_proj.id
                first_team = db.query(Team).filter(Team.project_id == project_id).first()
                if first_team:
                    team_id = first_team.id

        project_file = None
        if bill_id and bill_id.strip() and bill_id != "null" and bill_id != "undefined":
            try:
                project_file = db.query(ProjectFile).filter(ProjectFile.id == uuid.UUID(bill_id)).first()
                if not project_file:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft bill not found")
                if project_file.status != "DRAFT":
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit a bill that is not a draft")
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bill_id UUID format")

        from datetime import datetime, timezone
        now_utc = datetime.now(timezone.utc)

        # Process file if provided
        if upload_file:
            target_dir = CATEGORY_FOLDERS.get(category, "uploads/documents")
            os.makedirs(target_dir, exist_ok=True)

            # Read file contents & check size restriction
            contents = await upload_file.read()
            file_size = len(contents)

            if file_size > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{upload_file.filename}' exceeds the maximum allowed size of 100 MB."
                )

            # Generate unique filename on disk
            unique_name = f"{uuid.uuid4().hex[:10]}_{upload_file.filename}"
            disk_path = os.path.join(target_dir, unique_name)

            # Write file to disk
            with open(disk_path, "wb") as f:
                f.write(contents)

            relative_path = disk_path.replace("\\", "/")

            if project_file:
                # Delete old file from disk
                if os.path.exists(project_file.file_path):
                    try:
                        os.remove(project_file.file_path)
                    except Exception as e:
                        print("Failed to remove old file on draft edit:", e)
                
                project_file.file_name = unique_name
                project_file.original_file_name = upload_file.filename
                project_file.file_path = relative_path
                project_file.file_size = file_size
                project_file.mime_type = upload_file.content_type
            else:
                initial_status = status_val.upper() if status_val else ("PENDING" if category in ["report", "bill", "uc"] else "APPROVED")
                project_file = ProjectFile(
                    project_id=project_id,
                    team_id=team_id,
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
        else:
            if not project_file:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File is required for new uploads"
                )
            # Update meta on existing draft
            if event_name is not None:
                project_file.event_name = event_name

        if status_val:
            project_file.status = status_val.upper()
        
        project_file.updated_at = now_utc
        db.add(project_file)
        db.flush()

        # Handle User Submitted Utilization Certificates automatically
        if category == "uc":
            from app.common.models.utilization_certificate import UtilizationCertificate

            # Determine next version
            max_ver = db.query(func.max(UtilizationCertificate.version)).filter(
                UtilizationCertificate.project_id == project_id
            ).scalar()
            next_version = (max_ver or 0) + 1

            uc_record = UtilizationCertificate(
                project_id=project_id,
                file_id=project_file.id,
                uploaded_by_id=user.id,
                reporting_period="Reporting Period 2026-2027",
                version=next_version,
                status="PENDING_REVIEW"
            )
            db.add(uc_record)
            db.flush()

            # Create notification for Admin
            from app.common.models.user import User as DBUser
            from app.common.models.role import Role as DBRole
            admins = db.query(DBUser).join(DBRole).filter(DBRole.name.in_(["Super Admin", "Coordinator Admin", "Coordinator", "Admin"])).all()
            for admin_user in admins:
                try:
                    NotificationService.create_notification(
                        db=db,
                        user_id=str(admin_user.id),
                        title="New UC Submitted",
                        message=f"Fellow {user.name} uploaded Utilization Certificate v{next_version} for project ID: {project_id}.",
                        type="info",
                        action_path="/admin/uc",
                        action_label="Review UC"
                    )
                except Exception as n_err:
                    print("Failed to notify admin user on UC submission:", n_err)

            # Create audit log entry
            from app.common.models.audit_log import AuditLog
            audit = AuditLog(
                user_id=user.id,
                action="UC_UPLOAD",
                entity="UtilizationCertificate",
                remarks=f"Uploaded Utilization Certificate version {next_version} for project ID: {project_id}."
            )
            db.add(audit)

        # Handle associated transaction entries for Bills & Receipts
        if category == "bill" and transactions_json:
            import json
            from app.common.models.budget import Budget
            from app.common.models.budget_head import BudgetHead
            from app.common.models.expense import Expense
            from app.common.models.transaction import Transaction

            try:
                tx_rows = json.loads(transactions_json)
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid transactions JSON: {str(e)}")

            # If user is submitting (not draft), validate category balances
            is_submitting = (status_val and status_val.upper() != "DRAFT") or (project_file and project_file.status != "DRAFT")
            if is_submitting and project_id:
                from app.common.models.eyc_budget import EYCBudgetAllocation
                category_spent_temp = {}
                for row in tx_rows:
                    cat_name = row.get("category", "Miscellaneous").strip()
                    amt = float(row.get("amount", 0))
                    
                    cat_alloc = db.query(EYCBudgetAllocation).filter(
                        EYCBudgetAllocation.section == "FELLOWS_CAT",
                        EYCBudgetAllocation.project_id == project_id,
                        func.lower(EYCBudgetAllocation.budget_head) == cat_name.lower()
                    ).first()
                    
                    if not cat_alloc:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Insufficient category balance. Category '{cat_name}' has not been allocated any budget for this project."
                        )
                    
                    # Calculate utilized by other approved transactions
                    utilized = db.query(func.sum(Transaction.amount)).filter(
                        Transaction.project_id == project_id,
                        Transaction.category == cat_name,
                        Transaction.status == "APPROVED"
                    ).scalar() or 0.0
                    
                    allocated = float(cat_alloc.allocated_amount)
                    temp_spent = category_spent_temp.get(cat_name.lower(), 0.0)
                    
                    remaining = allocated - float(utilized) - temp_spent
                    if amt > remaining:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Insufficient category balance. Category '{cat_name}' has only Rs {remaining:,.2f} remaining, but you requested Rs {amt:,.2f}."
                        )
                    
                    category_spent_temp[cat_name.lower()] = temp_spent + amt

            # Delete old draft transactions if updating
            db.query(Transaction).filter(Transaction.bill_id == project_file.id).delete()

            # Verify active project budget
            budget = db.query(Budget).filter(Budget.project_id == project_id).first()
            if not budget:
                budget = Budget(
                    project_id=project_id,
                    financial_year="2026-2027",
                    total_allocated=Decimal("300000.00"),
                    status="ACTIVE"
                )
                db.add(budget)
                db.flush()

            for row in tx_rows:
                category_name = row.get("category", "Miscellaneous").strip()
                description = row.get("description", "").strip() or f"{category_name} Expense"
                amount_val = Decimal(str(row.get("amount", 0)))

                # Get BudgetHead
                budget_head = db.query(BudgetHead).filter(
                    BudgetHead.budget_id == budget.id,
                    func.lower(BudgetHead.name) == category_name.lower()
                ).first()
                if not budget_head:
                    budget_head = BudgetHead(
                        budget_id=budget.id,
                        name=category_name.capitalize(),
                        limit_amount=Decimal("50000.00")
                    )
                    db.add(budget_head)
                    db.flush()

                # Get Expense
                expense = db.query(Expense).filter(
                    Expense.budget_head_id == budget_head.id,
                    Expense.title == f"{category_name.capitalize()} Expenses"
                ).first()
                if not expense:
                    expense = Expense(
                        budget_head_id=budget_head.id,
                        title=f"{category_name.capitalize()} Expenses",
                        allocated_amount=Decimal("50000.00")
                    )
                    db.add(expense)
                    db.flush()

                # Map Transaction status: DRAFT bills create DRAFT transactions, otherwise PENDING
                tx_status = "DRAFT" if project_file.status == "DRAFT" else "PENDING"

                transaction_obj = Transaction(
                    expense_id=expense.id,
                    amount=amount_val,
                    description=description,
                    created_by_id=user.id,
                    status=tx_status,
                    source="BILL",
                    project_id=project_id,
                    team_id=team_id,
                    bill_id=project_file.id,
                    uploaded_by_id=user.id,
                    category=category_name,
                    transaction_date=now_utc
                )
                db.add(transaction_obj)

        db.commit()
        db.refresh(project_file)

        # Trigger real-time notifications for Admin & Accounts roles if not a draft
        if project_file.status != "DRAFT":
            roles_to_notify = [RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value]
            if category in ["bill", "uc"]:
                roles_to_notify.append(RoleEnum.ACCOUNTS.value)

            NotificationService.broadcast_notification(
                db=db,
                title=f"New {category.upper()} Uploaded",
                message=f"{user.name} uploaded {category}: '{project_file.original_file_name}'",
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

        # Sync associated transactions status
        if file_obj.category == "bill":
            from app.common.models.transaction import Transaction
            from app.common.models.eyc_budget import EYCBudgetAllocation
            from sqlalchemy import func
            
            txs = db.query(Transaction).filter(Transaction.bill_id == file_obj.id).all()
            if status_val.upper() == "APPROVED":
                category_spent_temp = {}
                for t in txs:
                    if t.project_id:
                        category_name = t.category or "Miscellaneous"
                        cat_alloc = db.query(EYCBudgetAllocation).filter(
                            EYCBudgetAllocation.section == "FELLOWS_CAT",
                            EYCBudgetAllocation.project_id == t.project_id,
                            func.lower(EYCBudgetAllocation.budget_head) == category_name.lower()
                        ).first()
                        
                        if not cat_alloc:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Insufficient category balance. Category '{category_name}' has not been allocated any budget for this project."
                            )
                        
                        # Already utilized excluding this batch
                        utilized = db.query(func.sum(Transaction.amount)).filter(
                            Transaction.project_id == t.project_id,
                            Transaction.category == t.category,
                            Transaction.status == "APPROVED",
                            Transaction.id != t.id
                        ).scalar() or 0.0
                        
                        allocated = float(cat_alloc.allocated_amount)
                        temp_spent = category_spent_temp.get((t.project_id, category_name.lower()), 0.0)
                        
                        remaining = allocated - float(utilized) - temp_spent
                        if float(t.amount) > remaining:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Insufficient category balance. Category '{category_name}' has only Rs {remaining:,.2f} remaining, but transaction requires Rs {float(t.amount):,.2f}."
                            )
                        
                        category_spent_temp[(t.project_id, category_name.lower())] = temp_spent + float(t.amount)

            for t in txs:
                if status_val.upper() == "APPROVED":
                    t.status = "APPROVED"
                    t.approved_by_id = current_user.id
                elif status_val.upper() == "REJECTED":
                    t.status = "REJECTED"
                elif status_val.upper() == "PENDING":
                    t.status = "PENDING"
                db.add(t)

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

        return ReportService._to_response(file_obj, db)

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

        # Delete associated transaction entries
        if file_obj.category == "bill":
            from app.common.models.transaction import Transaction
            db.query(Transaction).filter(Transaction.bill_id == file_obj.id).delete()

        db.delete(file_obj)
        db.commit()

        return {"message": "File deleted successfully"}
