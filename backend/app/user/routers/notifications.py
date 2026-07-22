from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.common.models.user import User
from app.notifications.schemas import NotificationResponse
from app.notifications.services.notification_service import NotificationService
from app.shared.responses import ResponseEnvelope, make_success_response

router = APIRouter(prefix="/notifications", tags=["Notification Operations"], dependencies=[Depends(get_current_user)])

@router.get("", response_model=ResponseEnvelope[List[NotificationResponse]])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        notifications = NotificationService.get_user_notifications(db, str(current_user.id))
        role_name = current_user.role.name if current_user.role else "USER"
        result = [NotificationResponse.from_orm_model(n, role_name) for n in notifications]
        return make_success_response(result)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{id}/read", response_model=ResponseEnvelope[NotificationResponse])
def mark_as_read(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        noti = NotificationService.mark_as_read(db, id, str(current_user.id))
        role_name = current_user.role.name if current_user.role else "USER"
        return make_success_response(NotificationResponse.from_orm_model(noti, role_name))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/read-all", response_model=ResponseEnvelope[dict])
def mark_all_as_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        NotificationService.mark_all_as_read(db, str(current_user.id))
        return make_success_response({"message": "All notifications marked as read"})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{id}", response_model=ResponseEnvelope[dict])
def delete_notification(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        NotificationService.delete_notification(db, id, str(current_user.id))
        return make_success_response({"message": "Notification dismissed"})
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
