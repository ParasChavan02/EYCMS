from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

class RegisterAdmin(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    admin_token: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenGenerateRequest(BaseModel):
    invited_name: str
    invited_email: EmailStr
    expiry_duration: str  # e.g., "24 Hours", "7 Days", "30 Days"

class TokenDetailResponse(BaseModel):
    id: str
    token: str
    invited_name: str
    invited_email: str
    status: str
    creator_name: str
    created_at: datetime
    expires_at: datetime
    used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    registration_ip: Optional[str] = None
    device: Optional[str] = None
