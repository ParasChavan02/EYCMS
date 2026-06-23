from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupportTicketCreate(BaseModel):
    issue: str
    category: str
    priority: Optional[str] = "Medium"
    screenshot_path: Optional[str] = None

class SupportTicketResponse(BaseModel):
    id: str
    issue: str
    category: str
    priority: str
    status: str
    created_at: datetime
