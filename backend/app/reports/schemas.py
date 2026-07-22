from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProjectFileResponse(BaseModel):
    id: str
    projectId: Optional[str] = Field(None, alias="project_id")
    teamId: Optional[str] = Field(None, alias="team_id")
    uploadedById: str = Field(..., alias="uploaded_by_id")
    uploadedByName: str = Field("Unknown", alias="uploaded_by_name")
    uploadedByEmail: str = Field("", alias="uploaded_by_email")
    category: str
    fileName: str = Field(..., alias="file_name")
    originalFileName: str = Field(..., alias="original_file_name")
    filePath: str = Field(..., alias="file_path")
    fileSize: int = Field(0, alias="file_size")
    mimeType: Optional[str] = Field(None, alias="mime_type")
    eventName: Optional[str] = Field(None, alias="event_name")
    status: str = "PENDING"
    adminNotes: Optional[str] = Field(None, alias="admin_notes")
    createdAt: str = Field(..., alias="created_at")
    updatedAt: str = Field(..., alias="updated_at")
    url: str = ""

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class ProjectFileStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None
