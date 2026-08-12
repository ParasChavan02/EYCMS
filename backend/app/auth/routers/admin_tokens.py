from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import secrets
from datetime import datetime, timedelta, timezone

from app.core.dependencies import get_db, require_super_admin
from app.common.models.user import User
from app.common.models.admin_token import AdminToken
from app.common.models.audit_log import AuditLog
from app.auth.schemas import TokenGenerateRequest, TokenDetailResponse
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/auth", tags=["Admin Tokens"])

@router.post("/admin-tokens", response_model=ResponseEnvelope[dict])
def generate_token(
    payload: TokenGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    try:
        # Determine expiry date
        now = datetime.now(timezone.utc)
        duration = payload.expiry_duration.lower()
        if "24 hours" in duration:
            expires_at = now + timedelta(hours=24)
        elif "7 days" in duration:
            expires_at = now + timedelta(days=7)
        elif "30 days" in duration:
            expires_at = now + timedelta(days=30)
        else:
            expires_at = now + timedelta(hours=24)  # fallback
            
        token_val = f"ey_token_{secrets.token_hex(12)}"
        
        new_token = AdminToken(
            token=token_val,
            invited_name=payload.invited_name,
            invited_email=payload.invited_email,
            created_by_id=current_user.id,
            status="ACTIVE",
            expires_at=expires_at
        )
        db.add(new_token)
        db.flush()
        
        # Log event in Audit Log table
        audit_log = AuditLog(
            user_id=current_user.id,
            action="Invitation Generated",
            entity="AdminToken",
            remarks=f"Invitation generated for {payload.invited_email} expiring in {payload.expiry_duration}"
        )
        db.add(audit_log)
        db.commit()
        
        return make_success_response({
            "id": str(new_token.id),
            "token": new_token.token,
            "invited_name": new_token.invited_name,
            "invited_email": new_token.invited_email,
            "status": new_token.status,
            "expires_at": new_token.expires_at.isoformat()
        })
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/admin-tokens", response_model=ResponseEnvelope[List[TokenDetailResponse]])
def get_tokens(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    try:
        tokens = db.query(AdminToken).order_by(AdminToken.created_at.desc()).all()
        
        response_data = []
        for t in tokens:
            response_data.append(TokenDetailResponse(
                id=str(t.id),
                token=t.token,
                invited_name=t.invited_name,
                invited_email=t.invited_email,
                status=t.status,
                creator_name=t.creator.name if t.creator else "Super Admin",
                created_at=t.created_at,
                expires_at=t.expires_at,
                used_at=t.used_at,
                revoked_at=t.revoked_at,
                registration_ip=t.registration_ip,
                device=t.device
            ))
            
        return make_success_response(response_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/admin-tokens/{id}", response_model=ResponseEnvelope[TokenDetailResponse])
def get_token_details(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    try:
        t = db.query(AdminToken).filter(AdminToken.id == id).first()
        if not t:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation token not found"
            )
            
        # Log view event
        audit_log = AuditLog(
            user_id=current_user.id,
            action="Invitation Viewed",
            entity="AdminToken",
            remarks=f"Invitation details viewed for {t.invited_email}"
        )
        db.add(audit_log)
        db.commit()
        
        data = TokenDetailResponse(
            id=str(t.id),
            token=t.token,
            invited_name=t.invited_name,
            invited_email=t.invited_email,
            status=t.status,
            creator_name=t.creator.name if t.creator else "Super Admin",
            created_at=t.created_at,
            expires_at=t.expires_at,
            used_at=t.used_at,
            revoked_at=t.revoked_at,
            registration_ip=t.registration_ip,
            device=t.device
        )
        return make_success_response(data)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/admin-tokens/{id}/revoke", response_model=ResponseEnvelope[dict])
def revoke_token(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    try:
        t = db.query(AdminToken).filter(AdminToken.id == id).first()
        if not t:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation token not found"
            )
            
        if t.status.upper() != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot revoke a token in {t.status} status"
            )
            
        t.status = "REVOKED"
        t.revoked_at = datetime.now(timezone.utc)
        db.add(t)
        
        # Log event in Audit Log table
        audit_log = AuditLog(
            user_id=current_user.id,
            action="Invitation Revoked",
            entity="AdminToken",
            remarks=f"Invitation revoked for {t.invited_email}"
        )
        db.add(audit_log)
        db.commit()
        
        return make_success_response({"success": True, "message": "Invitation token revoked successfully"})
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
