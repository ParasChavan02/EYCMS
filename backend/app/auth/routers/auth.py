from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.auth.schemas import LoginCredentials, RegisterUser, TokenResponse
from app.auth.services import AuthService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
def login(credentials: LoginCredentials, db: Session = Depends(get_db)):
    try:
        tokens = AuthService.authenticate_user(db, credentials)
        return make_success_response(tokens)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/register", response_model=ResponseEnvelope[dict])
def register(registration: RegisterUser, db: Session = Depends(get_db)):
    try:
        user = AuthService.register_user(db, registration)
        return make_success_response(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
def refresh(refresh_token: str):
    try:
        tokens = AuthService.refresh_access_token(refresh_token)
        return make_success_response(tokens)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
