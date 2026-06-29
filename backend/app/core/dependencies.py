from typing import Generator
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.core.permissions import RoleChecker
from app.common.models.user import User
from app.common.constants.enums import RoleEnum

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_db() -> Generator[Session, None, None]:
    """
    Retrieves database connection session and cleans up after request lifecycle.
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
    Resolves JWT token to fetch the current authenticated User model.
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
            detail="Invalid token, access token expected",
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials, subject missing",
        )
    
    try:
        # Retrieve user from database with eager-loaded role mapping
        user = db.query(User).filter(User.id == UUID(user_id)).first()
    except Exception:
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

# Helper Dependency Injection functions wrapping permission guards
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    checker = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN])
    return checker(current_user)

def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    checker = RoleChecker([RoleEnum.SUPER_ADMIN])
    return checker(current_user)

def require_user(current_user: User = Depends(get_current_user)) -> User:
    checker = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.USER])
    return checker(current_user)

def require_accounts(current_user: User = Depends(get_current_user)) -> User:
    checker = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ACCOUNTS])
    return checker(current_user)

# Keep legacy variables to preserve compatibility across modules
verify_admin = require_admin
verify_accounts = require_accounts
verify_user = require_user
verify_admin_or_accounts = RoleChecker([RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.ACCOUNTS])
