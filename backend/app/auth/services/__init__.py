from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
from app.auth.schemas import (
    LoginCredentials,
    RegisterUser,
    RegisterAdmin,
    TokenResponse,
    UserResponse
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    decode_token
)
from app.common.models.user import User
from app.common.models.role import Role
from app.common.models.admin_token import AdminToken
from app.common.models.audit_log import AuditLog

class AuthService:
    """
    Service layer containing core logic for database-backed authentication and registration.
    """
    @staticmethod
    def authenticate_user(db: Session, credentials: LoginCredentials) -> TokenResponse:
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user:
            raise Exception("Invalid email or password")
            
        if not user.is_active:
            raise Exception("Inactive user account")
            
        if not verify_password(credentials.password, user.password_hash):
            raise Exception("Invalid email or password")
            
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        
        # Log successful login event
        try:
            log = AuditLog(
                user_id=user.id,
                action="Login",
                entity="User",
                remarks=f"User logged in successfully with role: {user.role.name if user.role else 'USER'}"
            )
            db.add(log)
            db.commit()
        except Exception as e:
            db.rollback()
            print("Failed to record login audit log:", e)
            
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse(
                id=str(user.id),
                name=user.name,
                email=user.email,
                role=user.role.name if user.role else "USER",
                projectId=user.project.project_id if user.project else None,
                teamConfigured=user.team_configured
            )
        )

    @staticmethod
    def register_user(db: Session, registration_data: RegisterUser) -> dict:
        # Check if email exists
        existing_user = db.query(User).filter(User.email == registration_data.email).first()
        if existing_user:
            raise Exception("Email already registered")
            
        # Get USER role
        role = db.query(Role).filter(Role.name == "USER").first()
        if not role:
            raise Exception("Default role USER not found in system")
            
        new_user = User(
            name=registration_data.name,
            email=registration_data.email,
            password_hash=get_password_hash(registration_data.password),
            role_id=role.id,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "role_id": new_user.role_id,
            "is_active": new_user.is_active
        }

    @staticmethod
    def register_admin(db: Session, registration_data: RegisterAdmin, ip_address: str = None, device_info: str = None) -> dict:
        # 1. Fetch token and check existence
        token_record = db.query(AdminToken).filter(AdminToken.token == registration_data.admin_token).first()
        if not token_record:
            raise Exception("Invitation token does not exist")
            
        # 2. Check token status
        if token_record.status.upper() != "ACTIVE":
            raise Exception(f"Invitation token is in {token_record.status} status")
            
        # 3. Check expiration
        now_utc = datetime.now(timezone.utc)
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now_utc > expires_at:
            token_record.status = "EXPIRED"
            db.add(token_record)
            db.commit()
            raise Exception("Invitation token has expired")
            
        # 4. Check email match
        if token_record.invited_email.lower() != registration_data.email.lower():
            raise Exception("Email address does not match invitation details")
            
        # 5. Check if user already exists
        existing_user = db.query(User).filter(User.email == registration_data.email).first()
        if existing_user:
            raise Exception("Email already registered")
            
        # 6. Fetch ADMIN role
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            raise Exception("ADMIN role not found in system")
            
        # 7. Create Admin user
        new_admin = User(
            name=registration_data.name,
            email=registration_data.email,
            password_hash=get_password_hash(registration_data.password),
            role_id=admin_role.id,
            is_active=True
        )
        db.add(new_admin)
        db.flush()
        
        # 8. Mark token as USED
        token_record.status = "USED"
        token_record.used_at = datetime.now(timezone.utc)
        token_record.registration_ip = ip_address or "127.0.0.1"
        token_record.device = device_info or "Unknown Device"
        db.add(token_record)
        
        # 9. Log event in Audit Log table
        audit_log = AuditLog(
            user_id=new_admin.id,
            action="Invitation Used",
            entity="AdminToken",
            remarks=f"Admin invitation token {token_record.id} used by {registration_data.email}",
            ip_address=ip_address or "127.0.0.1"
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(new_admin)
        
        return {
            "id": str(new_admin.id),
            "name": new_admin.name,
            "email": new_admin.email,
            "role_id": new_admin.role_id,
            "is_active": new_admin.is_active
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise Exception("Invalid token type")
            
        user_id = payload.get("sub")
        if not user_id:
            raise Exception("Invalid refresh token credentials")
            
        access_token = create_access_token(subject=user_id)
        new_refresh = create_refresh_token(subject=user_id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh
        )
