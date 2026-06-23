from typing import Generator, List
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.common.models.user import User
from app.common.constants.roles import RoleEnum

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get a SQLAlchemy database session.
    Yields the session and closes it after the request lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    Dependency to validate the JWT from the Authorization header
    and retrieve the corresponding User object.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(token)
    token_type = payload.get("type")
    
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type, access token expected",
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials, subject missing",
        )
    
    try:
        # Retrieve user from database
        user = db.query(User).filter(User.id == UUID(user_id)).first()
    except Exception:
        # Fallback to prevent crash if database is not migrated yet
        user = None
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
        
    return user

class RoleChecker:
    """
    Dependency class that enforces Role-Based Access Control (RBAC).
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user.role or current_user.role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user does not have permissions to access this resource",
            )
        return current_user

# Preconfigured role guards for route dependency injections
verify_admin = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN])
verify_accounts = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ACCOUNTS])
verify_user = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.USER])
verify_admin_or_accounts = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.ACCOUNTS])
