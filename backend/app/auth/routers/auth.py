from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.auth.schemas import LoginCredentials, RegisterUser, RegisterAdmin, TokenResponse
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

@router.post("/user/register", response_model=ResponseEnvelope[dict])
def register_user_alias(registration: RegisterUser, db: Session = Depends(get_db)):
    try:
        user = AuthService.register_user(db, registration)
        return make_success_response(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/admin/register", response_model=ResponseEnvelope[dict])
def register_admin(registration: RegisterAdmin, request: Request, db: Session = Depends(get_db)):
    try:
        ip_address = request.client.host if request.client else "127.0.0.1"
        device_info = request.headers.get("User-Agent", "Unknown Device")
        user = AuthService.register_admin(db, registration, ip_address, device_info)
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
