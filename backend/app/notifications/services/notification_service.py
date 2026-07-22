from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from uuid import UUID
from app.common.models.notification import Notification
from app.common.models.user import User
from app.common.models.role import Role
from app.shared.logger import get_logger

logger = get_logger("notification_service")

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        title: str,
        message: str,
        type: str = "info",
        action_path: Optional[str] = None,
        action_label: Optional[str] = None
    ) -> Notification:
        """
        Creates a single notification entry for a specific user.
        """
        notification = Notification(
            user_id=UUID(user_id) if isinstance(user_id, str) else user_id,
            title=title,
            message=message,
            type=type,
            is_read=False,
            action_path=action_path,
            action_label=action_label
        )
        try:
            db.add(notification)
            db.commit()
            db.refresh(notification)
            logger.info(f"Notification created for User {user_id}: {title}")
            return notification
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create notification: {e}")
            raise e

    @staticmethod
    def broadcast_notification(
        db: Session,
        title: str,
        message: str,
        type: str = "info",
        roles: Optional[List[str]] = None,
        project_id: Optional[str] = None,
        action_path: Optional[str] = None,
        action_label: Optional[str] = None
    ) -> List[Notification]:
        """
        Broadcasts a notification to multiple users based on role filter or project filter.
        """
        query = db.query(User).filter(User.is_active == True)
        
        # Filter by roles if specified
        if roles:
            # Normalize role names to uppercase
            upper_roles = [r.upper() for r in roles]
            # Since User has a foreign key to Role, join Role and filter by Role.name
            query = query.join(Role).filter(Role.name.in_(upper_roles))
            
        # Filter by project if specified
        if project_id:
            query = query.filter(User.project_id == UUID(project_id))
            
        target_users = query.all()
        created_notifications = []
        
        logger.info(f"Broadcasting notification to {len(target_users)} target users. Roles: {roles}, Project: {project_id}")
        
        try:
            for user in target_users:
                noti = Notification(
                    user_id=user.id,
                    title=title,
                    message=message,
                    type=type,
                    is_read=False,
                    action_path=action_path,
                    action_label=action_label
                )
                db.add(noti)
                created_notifications.append(noti)
            db.commit()
            
            # Refresh all created objects
            for noti in created_notifications:
                db.refresh(noti)
                
            return created_notifications
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to broadcast notification: {e}")
            raise e
            
    @staticmethod
    def get_user_notifications(db: Session, user_id: str) -> List[Notification]:
        """
        Retrieves notifications list for the given user, ordered by creation date descending.
        """
        return db.query(Notification).filter(
            Notification.user_id == UUID(user_id)
        ).order_by(Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str) -> Notification:
        """
        Marks a specific notification as read.
        """
        noti = db.query(Notification).filter(
            Notification.id == UUID(notification_id),
            Notification.user_id == UUID(user_id)
        ).first()
        if not noti:
            raise ValueError("Notification not found")
            
        noti.is_read = True
        db.commit()
        db.refresh(noti)
        return noti

    @staticmethod
    def mark_all_as_read(db: Session, user_id: str) -> None:
        """
        Marks all unread notifications of a user as read.
        """
        db.query(Notification).filter(
            Notification.user_id == UUID(user_id),
            Notification.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        db.commit()

    @staticmethod
    def delete_notification(db: Session, notification_id: str, user_id: str) -> None:
        """
        Deletes/dismisses a single notification.
        """
        noti = db.query(Notification).filter(
            Notification.id == UUID(notification_id),
            Notification.user_id == UUID(user_id)
        ).first()
        if not noti:
            raise ValueError("Notification not found")
            
        db.delete(noti)
        db.commit()
