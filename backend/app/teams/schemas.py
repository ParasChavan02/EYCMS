from pydantic import BaseModel, EmailStr
from typing import List, Optional

class TeammateInvite(BaseModel):
    name: str
    email: EmailStr

class TeamSetupRequest(BaseModel):
    projectId: str
    teamMembers: List[TeammateInvite]
