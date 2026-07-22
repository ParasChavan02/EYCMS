from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str = "info"
    is_read: bool = False
    action_path: Optional[str] = None
    action_label: Optional[str] = None
    time: str = "Just now"
    roles: List[str] = []

    model_config = {
        "from_attributes": True
    }

    @classmethod
    def from_orm_model(cls, obj, role_name: str = "USER") -> "NotificationResponse":
        # Formulate relative time string
        now = datetime.now(timezone.utc)
        created_at = obj.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        diff = now - created_at
        seconds = diff.total_seconds()
        
        if seconds < 60:
            time_str = "Just now"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            time_str = f"{minutes} min{'s' if minutes > 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds // 3600)
            time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(seconds // 86400)
            time_str = f"{days} day{'s' if days > 1 else ''} ago"

        return cls(
            id=str(obj.id),
            user_id=str(obj.user_id),
            title=obj.title,
            message=obj.message,
            type=obj.type,
            is_read=obj.is_read,
            action_path=obj.action_path,
            action_label=obj.action_label,
            time=time_str,
            roles=[role_name]
        )

class NotificationBroadcast(BaseModel):
    title: str
    message: str
    type: str = "info"
    roles: Optional[List[str]] = None  # None/empty means all
    project_id: Optional[str] = None  # Specific project
    action_path: Optional[str] = None
    action_label: Optional[str] = None
