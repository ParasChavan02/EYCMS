from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import get_password_hash
from app.common.models.user import User
from app.common.models.invitation import Invitation
from app.common.models.audit_log import AuditLog
from app.invitations.schemas import InvitationAcceptRequest, InvitationVerifyResponse
from app.shared.logger import get_logger

logger = get_logger("invitation_service")

class InvitationService:
    @staticmethod
    def verify_token(db: Session, token: str) -> Invitation:
        invitation = db.query(Invitation).filter(Invitation.token == token).first()
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation token not found."
            )
            
        if invitation.status.upper() != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This invitation has already been {invitation.status.lower()}."
            )
            
        # Check expiry
        now_utc = datetime.now(timezone.utc)
        expires_at = invitation.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if now_utc > expires_at:
            invitation.status = "EXPIRED"
            db.add(invitation)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation token has expired."
            )
            
        return invitation

    @staticmethod
    def get_details(db: Session, token: str) -> InvitationVerifyResponse:
        invitation = InvitationService.verify_token(db, token)
        project_id_str = invitation.project.project_id if invitation.project else "UNKNOWN"
        
        return InvitationVerifyResponse(
            invited_name=invitation.invited_name,
            invited_email=invitation.invited_email,
            projectId=project_id_str,
            expires_at=invitation.expires_at,
            status=invitation.status
        )

    @staticmethod
    def accept_invitation(db: Session, payload: InvitationAcceptRequest) -> dict:
        if payload.password != payload.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match."
            )
            
        invitation = InvitationService.verify_token(db, payload.token)
        
        # Double check email duplication
        existing_user = db.query(User).filter(User.email == invitation.invited_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )
            
        # Create the new user
        new_user = User(
            name=payload.name,
            email=invitation.invited_email,
            password_hash=get_password_hash(payload.password),
            role_id=invitation.role_id,
            project_id=invitation.project_id,
            team_id=invitation.team_id,
            team_configured=True,
            is_active=True
        )
        db.add(new_user)
        db.flush()
        
        # Mark invitation as accepted
        invitation.status = "ACCEPTED"
        invitation.accepted_at = datetime.now(timezone.utc)
        db.add(invitation)
        
        # Log audit trail
        audit = AuditLog(
            user_id=new_user.id,
            action="Invitation Accepted",
            entity="Invitation",
            remarks=f"Teammate {new_user.email} joined project UUID {invitation.project_id} using token"
        )
        db.add(audit)
        
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Invitation accepted successfully. Created account for {new_user.email}")
        
        return {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "role_id": new_user.role_id,
            "is_active": new_user.is_active
        }
