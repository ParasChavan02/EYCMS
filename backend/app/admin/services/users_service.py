from datetime import datetime, date, timezone, timedelta
import uuid
import secrets
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.common.models.user import User
from app.common.models.project import Project
from app.common.models.team import Team
from app.common.models.invitation import Invitation
from app.common.models.role import Role
from app.common.models.audit_log import AuditLog
from app.core.security import get_password_hash
from app.common.services.email_service import EmailService
from app.notifications.services.notification_service import NotificationService
from app.core.config import settings

class AdminUsersService:
    @staticmethod
    def get_users_stats(db: Session) -> dict:
        total = db.query(User).count()
        active = db.query(User).filter(User.status == "Active").count()
        pending = db.query(Invitation).filter(Invitation.status == "PENDING_APPROVAL").count()
        inactive = db.query(User).filter(User.status == "Inactive").count()

        return {
            "total": total,
            "active": active,
            "pending": pending,
            "inactive": inactive
        }

    @staticmethod
    def get_users_list(
        db: Session,
        search: str = None,
        role: str = None,
        status_filter: str = None,
        department: str = None,
        project_id: str = None,
        team_id: str = None
    ) -> list:
        query = db.query(User)

        # Apply Filters
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.department.ilike(search_pattern)
                )
            )

        if role and role != "ALL":
            query = query.join(User.role).filter(Role.name == role)

        if status_filter and status_filter != "ALL":
            query = query.filter(User.status == status_filter)

        if department and department != "ALL":
            query = query.filter(User.department == department)

        if project_id and project_id != "ALL":
            # Can match UUID or project_id code
            try:
                project_uuid = uuid.UUID(project_id)
                query = query.filter(User.project_id == project_uuid)
            except ValueError:
                query = query.join(User.project).filter(Project.project_id == project_id)

        if team_id and team_id != "ALL":
            try:
                team_uuid = uuid.UUID(team_id)
                query = query.filter(User.team_id == team_uuid)
            except ValueError:
                query = query.join(User.team).filter(Team.name == team_id)

        users = query.all()
        results = []
        for user in users:
            results.append({
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role.name if user.role else "USER",
                "department": user.department or "Not Assigned",
                "project_id": user.project.project_id if user.project else "None",
                "project_uuid": str(user.project_id) if user.project_id else None,
                "team": user.team.name if user.team else "None",
                "team_id": str(user.team_id) if user.team_id else None,
                "status": user.status or "Active",
                "joining_date": user.joining_date.isoformat() if user.joining_date else None,
                "is_active": user.is_active,
                "contact_number": user.contact_number or ""
            })

        return results

    @staticmethod
    def create_user(db: Session, data: dict, admin_id: str) -> dict:
        email = data.get("email", "").strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        # Force role to USER
        role_name = "USER"
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise HTTPException(status_code=400, detail="USER role does not exist in system")

        proj_id = None
        t_id = None
        project_id_str = data.get("project_id", "").strip()
        if project_id_str:
            try:
                proj_id = uuid.UUID(project_id_str)
                team = db.query(Team).filter(Team.project_id == proj_id).first()
                if team:
                    t_id = team.id
            except ValueError:
                # Type is project code (e.g. PROJ-NEW-01)
                proj = db.query(Project).filter(func.lower(Project.project_id) == project_id_str.lower()).first()
                if not proj:
                    # Dynamically create Project!
                    proj = Project(
                        project_id=project_id_str,
                        title=f"Project {project_id_str}",
                        start_date=date.today(),
                        end_date=date.today() + timedelta(days=365),
                        duration=12,
                        status="ACTIVE"
                    )
                    db.add(proj)
                    db.flush()
                    
                    # Dynamically create default Team!
                    team = Team(
                        project_id=proj.id,
                        name=f"Team {project_id_str}",
                        leader_id=None
                    )
                    db.add(team)
                    db.flush()
                else:
                    # Find default team for existing project
                    team = db.query(Team).filter(Team.project_id == proj.id).first()
                    if not team:
                        team = Team(
                            project_id=proj.id,
                            name=f"Team {proj.project_id}",
                            leader_id=None
                        )
                        db.add(team)
                        db.flush()
                
                proj_id = proj.id
                t_id = team.id

        joining_date_val = None
        if data.get("joining_date"):
            try:
                joining_date_val = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()
            except ValueError:
                joining_date_val = date.today()

        raw_password = data.get("password") or "EYCMS@2026"
        status_val = data.get("status", "Active")

        new_user = User(
            name=data.get("name", "").strip(),
            email=email,
            password_hash=get_password_hash(raw_password),
            role_id=role.id,
            project_id=proj_id,
            team_id=t_id,
            department=data.get("department"),
            status=status_val,
            is_active=(status_val == "Active"),
            team_configured=(proj_id is not None and t_id is not None),
            contact_number=data.get("contact_number")
        )
        if joining_date_val:
            new_user.joining_date = joining_date_val

        db.add(new_user)
        db.flush()

        # Log audit trail
        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Create User",
            entity="User",
            remarks=f"Created user {email} with role {role_name}, status {status_val}."
        )
        db.add(audit)
        db.commit()
        db.refresh(new_user)

        return {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "role": role_name,
            "status": new_user.status,
            "is_active": new_user.is_active,
            "contact_number": new_user.contact_number
        }

    @staticmethod
    def update_user(db: Session, user_id: str, data: dict, admin_id: str) -> dict:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        email = data.get("email", "").strip().lower()
        if email and email != user.email:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already in use")
            user.email = email

        if "name" in data:
            user.name = data["name"].strip()

        if "department" in data:
            user.department = data["department"]

        if "role" in data:
            role_name = data["role"].upper()
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                user.role_id = role.id

        if "project_id" in data:
            project_id_str = data["project_id"]
            if not project_id_str or project_id_str == "None" or project_id_str == "":
                user.project_id = None
                user.team_id = None
            else:
                try:
                    user.project_id = uuid.UUID(project_id_str)
                    team = db.query(Team).filter(Team.project_id == user.project_id).first()
                    if team:
                        user.team_id = team.id
                except ValueError:
                    proj = db.query(Project).filter(func.lower(Project.project_id) == project_id_str.lower()).first()
                    if not proj:
                        # Auto-create Project
                        proj = Project(
                            project_id=project_id_str,
                            title=f"Project {project_id_str}",
                            start_date=date.today(),
                            end_date=date.today() + timedelta(days=365),
                            duration=12,
                            status="ACTIVE"
                        )
                        db.add(proj)
                        db.flush()
                        # Auto-create default team
                        team = Team(
                            project_id=proj.id,
                            name=f"Team {project_id_str}",
                            leader_id=None
                        )
                        db.add(team)
                        db.flush()
                    else:
                        team = db.query(Team).filter(Team.project_id == proj.id).first()
                        if not team:
                            team = Team(
                                project_id=proj.id,
                                name=f"Team {proj.project_id}",
                                leader_id=None
                            )
                            db.add(team)
                            db.flush()
                    user.project_id = proj.id
                    user.team_id = team.id

        if "team_id" in data and data["team_id"] is not None:
            if data["team_id"] == "None" or data["team_id"] == "":
                user.team_id = None
            else:
                try:
                    user.team_id = uuid.UUID(data["team_id"])
                except ValueError:
                    pass

        if "joining_date" in data:
            if data["joining_date"]:
                try:
                    user.joining_date = datetime.strptime(data["joining_date"], "%Y-%m-%d").date()
                except ValueError:
                    pass
            else:
                user.joining_date = None

        if "status" in data:
            user.status = data["status"]
            user.is_active = (data["status"] == "Active")

        if "contact_number" in data:
            user.contact_number = data["contact_number"]

        db.add(user)

        # Log audit trail
        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Update User",
            entity="User",
            remarks=f"Updated details for user {user.email}."
        )
        db.add(audit)
        db.commit()
        db.refresh(user)

        return {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "status": user.status,
            "is_active": user.is_active,
            "contact_number": user.contact_number
        }

    @staticmethod
    def reset_password(db: Session, user_id: str, new_password: str = None, admin_id: str = None) -> dict:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        pwd = new_password or "EYCMS@Reset2026"
        user.password_hash = get_password_hash(pwd)
        db.add(user)

        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Reset Password",
            entity="User",
            remarks=f"Reset password for user {user.email}."
        )
        db.add(audit)
        db.commit()

        # Send Reset Notification Email
        subject = "Your E-YUVA ERP Account Password Reset"
        body = f"""
        <html>
            <body>
                <h2>Password Reset Confirmation</h2>
                <p>Hello {user.name},</p>
                <p>Your password has been reset by the System Administrator.</p>
                <p>Your temporary password is: <strong>{pwd}</strong></p>
                <p>Please log in and update your password immediately.</p>
                <p>Best regards,<br/>E-YUVA Support Team</p>
            </body>
        </html>
        """
        EmailService.send_email(db, user.email, subject, body)

        return {"success": True, "message": "Password reset successfully and email sent."}

    @staticmethod
    def toggle_user_status(db: Session, user_id: str, admin_id: str) -> dict:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = not user.is_active
        user.status = "Active" if user.is_active else "Inactive"
        db.add(user)

        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Toggle User Status",
            entity="User",
            remarks=f"Toggled user status of {user.email} to {user.status}."
        )
        db.add(audit)
        db.commit()

        return {"id": str(user.id), "is_active": user.is_active, "status": user.status}

    @staticmethod
    def remove_user_access(db: Session, user_id: str, admin_id: str) -> dict:
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Disable credentials, clear project/team membership but retain record
        user.is_active = False
        user.status = "Inactive"
        user.project_id = None
        user.team_id = None
        user.team_configured = False
        db.add(user)

        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Remove Access",
            entity="User",
            remarks=f"Revoked credentials & cleared project membership for {user.email}."
        )
        db.add(audit)
        db.commit()

        return {"id": str(user.id), "status": user.status, "message": "User access removed successfully"}

    @staticmethod
    def get_projects_list(db: Session) -> list:
        projects = db.query(Project).all()
        results = []

        for proj in projects:
            # Main/First Team Leader associated with this project
            leader_name = "None"
            main_team = db.query(Team).filter(Team.project_id == proj.id).first()
            if main_team and main_team.leader:
                leader_name = main_team.leader.name

            member_count = db.query(User).filter(User.project_id == proj.id).count()

            results.append({
                "project_uuid": str(proj.id),
                "project_id": proj.project_id,
                "project_name": proj.title,
                "team_leader_name": leader_name,
                "member_count": member_count,
                "status": proj.status
            })

        return results

    @staticmethod
    def get_project_detail(db: Session, project_uuid: str) -> dict:
        proj = db.query(Project).filter(Project.id == uuid.UUID(project_uuid)).first()
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

        # Teams details
        teams_list = []
        teams = db.query(Team).filter(Team.project_id == proj.id).all()
        for team in teams:
            teams_list.append({
                "team_id": str(team.id),
                "name": team.name,
                "leader_id": str(team.leader_id) if team.leader_id else None,
                "leader_name": team.leader.name if team.leader else "None",
                "leader_email": team.leader.email if team.leader else "None"
            })

        # Members details
        members = db.query(User).filter(User.project_id == proj.id).all()
        members_list = []
        for m in members:
            members_list.append({
                "id": str(m.id),
                "name": m.name,
                "email": m.email,
                "role": m.role.name if m.role else "USER",
                "department": m.department or "Not Assigned",
                "status": m.status or "Active",
                "joining_date": m.joining_date.isoformat() if m.joining_date else "Not set"
            })

        # Team Member Summary
        summary = {
            "total_members": len(members_list),
            "roles": {},
            "statuses": {}
        }
        for m in members_list:
            summary["roles"][m["role"]] = summary["roles"].get(m["role"], 0) + 1
            summary["statuses"][m["status"]] = summary["statuses"].get(m["status"], 0) + 1

        # Recent Activity
        user_ids = [m.id for m in members]
        recent_activity = []
        if user_ids:
            activities = (
                db.query(AuditLog)
                .filter(AuditLog.user_id.in_(user_ids))
                .order_by(AuditLog.created_at.desc())
                .limit(10)
                .all()
            )
            for act in activities:
                recent_activity.append({
                    "id": str(act.id),
                    "user_name": act.user.name,
                    "action": act.action,
                    "entity": act.entity,
                    "remarks": act.remarks,
                    "timestamp": act.created_at.isoformat()
                })

        return {
            "project_uuid": str(proj.id),
            "project_id": proj.project_id,
            "title": proj.title,
            "mentor_name": proj.mentor_name or "None",
            "description": proj.description or "No description",
            "start_date": proj.start_date.isoformat(),
            "end_date": proj.end_date.isoformat(),
            "status": proj.status,
            "teams": teams_list,
            "members": members_list,
            "summary": summary,
            "recent_activity": recent_activity
        }

    @staticmethod
    def get_onboarding_requests(db: Session) -> list:
        invitations = db.query(Invitation).all()
        results = []

        for inv in invitations:
            results.append({
                "id": str(inv.id),
                "name": inv.invited_name,
                "email": inv.invited_email,
                "requested_by": inv.creator.name if inv.creator else "System",
                "project_id": inv.project.project_id if inv.project else "None",
                "project_uuid": str(inv.project_id),
                "team_id": str(inv.team_id),
                "team_name": inv.team.name if inv.team else "None",
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
                "status": inv.status
            })

        return results

    @staticmethod
    def approve_onboarding_request(db: Session, request_uuid: str, admin_id: str) -> dict:
        inv = db.query(Invitation).filter(Invitation.id == uuid.UUID(request_uuid)).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Onboarding request not found")

        if inv.status != "PENDING_APPROVAL":
            raise HTTPException(status_code=400, detail=f"Request status is {inv.status}, expected PENDING_APPROVAL")

        # Check if user already exists
        existing = db.query(User).filter(User.email == inv.invited_email).first()
        if existing:
            inv.status = "ACCEPTED"
            db.add(inv)
            db.commit()
            raise HTTPException(status_code=400, detail="User already registered with this email")

        # Automatically create the User account
        temp_pwd = f"EYCMS@{secrets.token_hex(4)}"
        
        # Default user role
        user_role = db.query(Role).filter(Role.name == "USER").first()
        if not user_role:
            raise HTTPException(status_code=500, detail="USER role not found")

        new_user = User(
            name=inv.invited_name,
            email=inv.invited_email.strip().lower(),
            password_hash=get_password_hash(temp_pwd),
            role_id=user_role.id,
            project_id=inv.project_id,
            team_id=inv.team_id,
            department="Operations",  # default onboarding department
            status="Active",
            is_active=True,
            team_configured=True,
            joining_date=date.today()
        )
        db.add(new_user)
        db.flush()

        # Update invitation status
        inv.status = "ACCEPTED"
        inv.accepted_at = datetime.now(timezone.utc)
        db.add(inv)

        # Log admin approval and user creation
        audit_admin = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Approve Onboarding",
            entity="Invitation",
            remarks=f"Approved onboarding request for {inv.invited_email}."
        )
        db.add(audit_admin)

        audit_user = AuditLog(
            user_id=new_user.id,
            action="Account Created",
            entity="User",
            remarks=f"Account automatically created and activated by admin onboarding approval."
        )
        db.add(audit_user)

        # Create in-app notification to the Team Leader who invited them
        NotificationService.create_notification(
            db=db,
            user_id=str(inv.created_by_id),
            title="Teammate Invitation Approved",
            message=f"Your invite for {inv.invited_name} has been approved by admin. Account is now active.",
            type="success",
            action_path="/admin/users"
        )

        db.commit()

        # Send onboarding welcome email with temp credentials
        subject = "E-YUVA ERP Teammate Account Activated"
        login_url = f"{settings.FRONTEND_URL}/login" if hasattr(settings, "FRONTEND_URL") else "http://localhost:5173/login"
        body = f"""
        <html>
            <body>
                <h2>Welcome to E-YUVA ERP</h2>
                <p>Hello {new_user.name},</p>
                <p>Your team onboarding invitation has been approved by the Administrator, and your account is now active.</p>
                <p>Below are your temporary login credentials:</p>
                <p><strong>Login URL:</strong> <a href="{login_url}">{login_url}</a></p>
                <p><strong>Username/Email:</strong> {new_user.email}</p>
                <p><strong>Temporary Password:</strong> {temp_pwd}</p>
                <p>Please log in and update your password immediately upon first login.</p>
                <p>Best regards,<br/>E-YUVA Support Team</p>
            </body>
        </html>
        """
        EmailService.send_email(db, new_user.email, subject, body)

        return {"success": True, "user_id": str(new_user.id)}

    @staticmethod
    def reject_onboarding_request(db: Session, request_uuid: str, admin_id: str) -> dict:
        inv = db.query(Invitation).filter(Invitation.id == uuid.UUID(request_uuid)).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Onboarding request not found")

        if inv.status != "PENDING_APPROVAL":
            raise HTTPException(status_code=400, detail=f"Request status is {inv.status}, expected PENDING_APPROVAL")

        inv.status = "REVOKED"
        db.add(inv)

        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Reject Onboarding",
            entity="Invitation",
            remarks=f"Rejected onboarding request for {inv.invited_email}."
        )
        db.add(audit)

        # Notify Team Leader
        NotificationService.create_notification(
            db=db,
            user_id=str(inv.created_by_id),
            title="Teammate Invitation Rejected",
            message=f"Your invite for {inv.invited_name} was rejected by the administrator.",
            type="error"
        )

        db.commit()
        return {"success": True}

    @staticmethod
    def get_user_activity(db: Session, user_id: str) -> list:
        user_uuid = uuid.UUID(user_id)
        logs = (
            db.query(AuditLog)
            .filter(AuditLog.user_id == user_uuid)
            .order_by(AuditLog.created_at.desc())
            .all()
        )
        results = []
        for log in logs:
            results.append({
                "id": str(log.id),
                "action": log.action,
                "entity": log.entity,
                "remarks": log.remarks,
                "timestamp": log.created_at.isoformat()
            })
        return results

    @staticmethod
    def create_project(db: Session, data: dict, admin_id: str) -> dict:
        project_id_str = data.get("project_id", "").strip()
        title_str = data.get("title", "").strip()
        
        if not project_id_str or not title_str:
            raise HTTPException(status_code=400, detail="Project ID and Title are required")
            
        existing = db.query(Project).filter(func.lower(Project.project_id) == project_id_str.lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Project with ID '{project_id_str}' already exists")
            
        new_proj = Project(
            project_id=project_id_str,
            title=title_str,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            duration=12,
            status="ACTIVE"
        )
        db.add(new_proj)
        db.flush()
        
        # Create default team
        new_team = Team(
            project_id=new_proj.id,
            name=f"Team {project_id_str}",
            leader_id=None
        )
        db.add(new_team)
        
        # Log Audit Trail
        audit = AuditLog(
            user_id=uuid.UUID(admin_id),
            action="Create Project",
            entity="Project",
            remarks=f"Created project {project_id_str}: {title_str}."
        )
        db.add(audit)
        db.commit()
        db.refresh(new_proj)
        
        return {
            "project_uuid": str(new_proj.id),
            "project_id": new_proj.project_id,
            "title": new_proj.title,
            "status": new_proj.status
        }
