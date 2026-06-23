from sqlalchemy.orm import Session
from app.auth.schemas import LoginCredentials, RegisterUser, TokenResponse
from app.core.security import create_access_token, create_refresh_token

class AuthService:
    """
    Service layer containing core logic for authentication and tokens management.
    Currently utilizes mocks for testing backend integrity.
    """
    @staticmethod
    def authenticate_user(db: Session, credentials: LoginCredentials) -> TokenResponse:
        # Placeholder login success token mapping
        access_token = create_access_token(subject="00000000-0000-0000-0000-000000000000")
        refresh_token = create_refresh_token(subject="00000000-0000-0000-0000-000000000000")
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )

    @staticmethod
    def register_user(db: Session, registration_data: RegisterUser) -> dict:
        # Placeholder registration payload
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "name": registration_data.name,
            "email": registration_data.email,
            "role_id": registration_data.role_id,
            "is_active": True
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> TokenResponse:
        # Placeholder access token regeneration
        access_token = create_access_token(subject="00000000-0000-0000-0000-000000000000")
        new_refresh = create_refresh_token(subject="00000000-0000-0000-0000-000000000000")
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh
        )
