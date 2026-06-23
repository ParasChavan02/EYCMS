from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
