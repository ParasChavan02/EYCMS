from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# User/Admin details in response
class SupportUserMini(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    organization: Optional[str] = None

class SupportTicketCreate(BaseModel):
    issue: str
    description: Optional[str] = None
    category: str
    priority: Optional[str] = "MEDIUM"
    screenshot_path: Optional[str] = None

class SupportTicketMessageCreate(BaseModel):
    message: str
    attachments: Optional[List[Dict[str, Any]]] = None

class SupportTicketMessageResponse(BaseModel):
    id: str
    ticketId: str = Field(..., alias="ticket_id")
    sender: SupportUserMini
    message: str
    attachments: List[Dict[str, Any]] = []
    createdAt: str = Field(..., alias="created_at")
    isAdminReply: bool = Field(..., alias="is_admin_reply")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class SupportTicketResponse(BaseModel):
    id: str
    ticketId: str = Field(..., alias="ticket_id")
    user: SupportUserMini
    title: str = Field(..., alias="issue")
    description: Optional[str] = None
    category: str
    priority: str
    status: str
    assignedTo: Optional[SupportUserMini] = Field(None, alias="assigned_to")
    createdAt: str = Field(..., alias="created_at")
    updatedAt: str = Field(..., alias="updated_at")
    resolvedAt: Optional[str] = Field(None, alias="resolved_at")
    closedAt: Optional[str] = Field(None, alias="closed_at")
    attachments: List[Dict[str, Any]] = []
    messages: List[SupportTicketMessageResponse] = []
    adminNotes: Optional[str] = Field(None, alias="admin_notes")
    estimatedResolutionTime: Optional[str] = Field(None, alias="estimated_resolution_time")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class SupportTicketAssign(BaseModel):
    admin_id: str

class SupportTicketStatusUpdate(BaseModel):
    status: str

class SupportTicketNotesUpdate(BaseModel):
    notes: str

class SupportTicketEscalate(BaseModel):
    reason: str

# Feature Request Schemas
class FeatureRequestCreate(BaseModel):
    title: str
    description: str
    benefit: str

class FeatureRequestStatusUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

class FeatureRequestResponse(BaseModel):
    id: str
    requestId: str = Field(..., alias="request_id")
    requestedBy: Optional[SupportUserMini] = Field(None, alias="requested_by")
    title: str
    description: str
    benefit: str
    votes: int = 1
    status: str = "Open"
    createdAt: str = Field(..., alias="created_at")
    updatedAt: str = Field(..., alias="updated_at")
    comments: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

