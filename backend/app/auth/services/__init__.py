from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.auth.schemas import LoginCredentials, RegisterUser, TokenResponse
from app.core.security import create_access_token, create_refresh_token, verify_password, get_password_hash
from app.common.models.user import User


class AuthService:

    @staticmethod
    def authenticate_user(db: Session, credentials: LoginCredentials) -> TokenResponse:

        # 1. Find user in DB
        user = db.query(User).filter(User.email == credentials.email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # 2. Verify password against hashed_password column
        if not verify_password(credentials.password, user.hashed_password):  # ✅ fixed
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # 3. Create tokens
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    def register_user(db: Session, registration_data: RegisterUser) -> dict:

        # Check if email already exists
        existing = db.query(User).filter(User.email == registration_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        user = User(
            name=registration_data.name,
            email=registration_data.email,
            hashed_password=get_password_hash(registration_data.password),  # ✅ fixed
            role_id=registration_data.role_id,
            is_active=True
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role_id": user.role_id,
            "is_active": user.is_active
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> TokenResponse:

        from app.core.security import decode_token

        payload = decode_token(refresh_token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")

        access_token = create_access_token(subject=user_id)
        new_refresh = create_refresh_token(subject=user_id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh
        )