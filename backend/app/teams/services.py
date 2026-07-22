import secrets
from datetime import datetime, timedelta, date, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.config import settings
from app.common.models.user import User
from app.common.models.project import Project
from app.common.models.team import Team
from app.common.models.invitation import Invitation
from app.common.models.role import Role
from app.common.services.email_service import EmailService
from app.teams.schemas import TeamSetupRequest, TeammateInvite
from app.shared.logger import get_logger

logger = get_logger("team_service")

class TeamService:
    @staticmethod
    def setup_team(db: Session, current_user: User, payload: TeamSetupRequest) -> User:
        logger.info(f"Setting up team for user {current_user.email} with project {payload.projectId}")
        
        project_id_str = payload.projectId.strip().upper()
        if not project_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project ID is required."
            )
            
        # 1. Fetch or create project
        project = db.query(Project).filter(Project.project_id == project_id_str).first()
        if not project:
            logger.info(f"Creating new project: {project_id_str}")
            project = Project(
                project_id=project_id_str,
                title=f"Project {project_id_str}",
                start_date=date.today(),
                end_date=date.today() + timedelta(days=365),
                duration=12,
                status="ACTIVE"
            )
            db.add(project)
            db.flush()
            
        # 2. Fetch or create team
        team = db.query(Team).filter(
            Team.project_id == project.id,
            Team.leader_id == current_user.id
        ).first()
        
        if not team:
            logger.info(f"Creating new team for project {project_id_str}")
            team = Team(
                project_id=project.id,
                name=f"Team {project_id_str}",
                leader_id=current_user.id
            )
            db.add(team)
            db.flush()
            
        # 3. Associate leader user
        current_user.project_id = project.id
        current_user.team_id = team.id
        current_user.team_configured = True
        db.add(current_user)
        
        # 4. Process teammate invitations
        user_role = db.query(Role).filter(Role.name == "USER").first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Default role USER not found in system."
            )
            
        for member in payload.teamMembers:
            email = member.email.strip().lower()
            name = member.name.strip()
            
            if not email or not name:
                continue
                
            if email == current_user.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot invite yourself as a teammate."
                )
                
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User with email {email} is already registered."
                )
                
            # Create/Revoke previous invitations to clean up duplicate active tokens
            active_invites = db.query(Invitation).filter(
                Invitation.invited_email == email,
                Invitation.status == "PENDING"
            ).all()
            for inv in active_invites:
                inv.status = "REVOKED"
                db.add(inv)
                
            token = f"ey_invite_{secrets.token_hex(16)}"
            invitation = Invitation(
                token=token,
                invited_name=name,
                invited_email=email,
                project_id=project.id,
                team_id=team.id,
                role_id=user_role.id,
                created_by_id=current_user.id,
                status="PENDING",
                expires_at=datetime.now(timezone.utc) + timedelta(days=7)
            )
            db.add(invitation)
            
            # Send invitation email
            invite_link = f"{settings.FRONTEND_URL}/accept-invitation?token={token}"
            subject = f"Invitation to join Project {project_id_str} on E-YUVA ERP"
            body = f"""
            <html>
                <body>
                    <h2>Hello {name},</h2>
                    <p>You have been invited by <strong>{current_user.name}</strong> to join the team for project <strong>{project_id_str}</strong> on E-YUVA ERP.</p>
                    <p>To accept the invitation and set up your account, click the button below:</p>
                    <p>
                        <a href="{invite_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Accept Invitation
                        </a>
                    </p>
                    <p>Alternatively, copy and paste the following link into your browser:</p>
                    <p><a href="{invite_link}">{invite_link}</a></p>
                    <p>This link will expire in 7 days.</p>
                    <p>Best regards,<br/>E-YUVA Support Team</p>
                </body>
            </html>
            """
            EmailService.send_email(db, email, subject, body)
            
        db.commit()
        db.refresh(current_user)
        logger.info(f"Team setup completed successfully for {current_user.email}")
        return current_user

    @staticmethod
    def invite_teammate(db: Session, current_user: User, member: TeammateInvite) -> dict:
        if not current_user.project_id or not current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must set up your team and project workspace first."
            )
            
        email = member.email.strip().lower()
        name = member.name.strip()
        
        if email == current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot invite yourself as a teammate."
            )
            
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {email} is already registered."
            )
            
        # Revoke previous active invites
        active_invites = db.query(Invitation).filter(
            Invitation.invited_email == email,
            Invitation.status == "PENDING"
        ).all()
        for inv in active_invites:
            inv.status = "REVOKED"
            db.add(inv)
            
        user_role = db.query(Role).filter(Role.name == "USER").first()
        token = f"ey_invite_{secrets.token_hex(16)}"
        invitation = Invitation(
            token=token,
            invited_name=name,
            invited_email=email,
            project_id=current_user.project_id,
            team_id=current_user.team_id,
            role_id=user_role.id,
            created_by_id=current_user.id,
            status="PENDING",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.add(invitation)
        
        project = db.query(Project).filter(Project.id == current_user.project_id).first()
        project_id_str = project.project_id if project else "UNKNOWN"
        
        # Send invitation email
        invite_link = f"{settings.FRONTEND_URL}/accept-invitation?token={token}"
        subject = f"Invitation to join Project {project_id_str} on E-YUVA ERP"
        body = f"""
        <html>
            <body>
                <h2>Hello {name},</h2>
                <p>You have been invited by <strong>{current_user.name}</strong> to join the team for project <strong>{project_id_str}</strong> on E-YUVA ERP.</p>
                <p>To accept the invitation and set up your account, click the button below:</p>
                <p>
                    <a href="{invite_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Accept Invitation
                    </a>
                </p>
                <p>Alternatively, copy and paste the following link into your browser:</p>
                <p><a href="{invite_link}">{invite_link}</a></p>
                <p>This link will expire in 7 days.</p>
                <p>Best regards,<br/>E-YUVA Support Team</p>
            </body>
        </html>
        """
        EmailService.send_email(db, email, subject, body)
        db.commit()
        return {"success": True, "message": f"Invitation email sent to {email}"}
