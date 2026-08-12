from pydantic import BaseModel, EmailStr
from datetime import datetime

class InvitationVerifyResponse(BaseModel):
    invited_name: str
    invited_email: EmailStr
    projectId: str
    expires_at: datetime
    status: str

class InvitationAcceptRequest(BaseModel):
    token: str
    name: str
    password: str
    confirm_password: str
