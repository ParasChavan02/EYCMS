from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import json
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.common.models.support_ticket import SupportTicket
from app.common.models.support_ticket_message import SupportTicketMessage
from app.common.models.feature_request import FeatureRequestModel
from app.common.models.user import User
from app.common.models.role import Role
from app.common.constants.enums import RoleEnum
from app.notifications.services.notification_service import NotificationService
from app.common.services.email_service import EmailService
from app.support.schemas import (
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketMessageResponse,
    SupportUserMini,
    FeatureRequestCreate,
    FeatureRequestResponse
)

class SupportService:
    @staticmethod
    def _to_user_mini(user: Optional[User]) -> Optional[SupportUserMini]:
        if not user:
            return None
        return SupportUserMini(
            id=str(user.id),
            name=user.name,
            email=user.email,
            phone="N/A",  # Placeholders or add project/role details
            organization="E-YUVA Project"
        )

    @staticmethod
    def _to_ticket_response(ticket: SupportTicket) -> SupportTicketResponse:
        # Deserialize attachments if present
        attachment_list = []
        if ticket.screenshot_path:
            # Check if screenshot path is stored as a JSON array or simple string
            try:
                decoded = json.loads(ticket.screenshot_path)
                if isinstance(decoded, list):
                    attachment_list = decoded
                else:
                    attachment_list = [decoded]
            except Exception:
                attachment_list = [{
                    "id": "att-0",
                    "fileName": ticket.screenshot_path.split("/")[-1] if "/" in ticket.screenshot_path else "screenshot",
                    "fileSize": 1024 * 100,
                    "fileType": "image/png",
                    "url": ticket.screenshot_path,
                    "uploadedAt": ticket.created_at.isoformat()
                }]

        # Prepare messages
        messages_resp = []
        for msg in ticket.messages:
            msg_attachments = []
            if msg.attachments:
                try:
                    msg_attachments = json.loads(msg.attachments)
                except Exception:
                    pass
            messages_resp.append(
                SupportTicketMessageResponse(
                    id=str(msg.id),
                    ticket_id=str(msg.ticket_id),
                    sender=SupportService._to_user_mini(msg.sender),
                    message=msg.message,
                    attachments=msg_attachments,
                    created_at=msg.created_at.isoformat(),
                    is_admin_reply=msg.is_admin_reply
                )
            )

        return SupportTicketResponse(
            id=str(ticket.id),
            ticket_id=f"TK-{str(ticket.id)[:6].upper()}",
            user=SupportService._to_user_mini(ticket.creator),
            issue=ticket.issue,
            description=ticket.description,
            category=ticket.category,
            priority=ticket.priority.upper(),
            status=ticket.status.upper(),
            assigned_to=SupportService._to_user_mini(ticket.assigned_to),
            created_at=ticket.created_at.isoformat(),
            updated_at=ticket.updated_at.isoformat() if ticket.updated_at else ticket.created_at.isoformat(),
            resolved_at=ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            closed_at=ticket.closed_at.isoformat() if ticket.closed_at else None,
            attachments=attachment_list,
            messages=messages_resp,
            admin_notes=ticket.admin_notes,
            estimated_resolution_time=ticket.estimated_resolution_time
        )

    @staticmethod
    def create_ticket(
        db: Session, 
        payload: SupportTicketCreate, 
        user_id: str
    ) -> SupportTicketResponse:
        """
        Creates a support ticket, logs it to database, and triggers Admin notifications.
        """
        ticket = SupportTicket(
            issue=payload.issue,
            description=payload.description,
            category=payload.category,
            priority=payload.priority or "MEDIUM",
            status="OPEN",
            created_by_id=uuid.UUID(user_id),
            screenshot_path=payload.screenshot_path
        )
        
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        
        # Notify Admins and Super Admins
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        admin_roles = [RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value]
        NotificationService.broadcast_notification(
            db=db,
            title="New Support Ticket raised",
            message=f"User {user.name if user else 'Fellow'} raised ticket: '{payload.issue}'",
            type="info",
            roles=admin_roles,
            action_path=f"/admin/support/ticket/{ticket.id}",
            action_label="Review ticket"
        )
        
        return SupportService._to_ticket_response(ticket)

    @staticmethod
    def list_user_tickets(db: Session, user_id: str) -> List[SupportTicketResponse]:
        """
        List tickets created by a specific user.
        """
        tickets = db.query(SupportTicket).filter(
            SupportTicket.created_by_id == uuid.UUID(user_id)
        ).order_by(SupportTicket.created_at.desc()).all()
        
        return [SupportService._to_ticket_response(t) for t in tickets]

    @staticmethod
    def list_all_tickets(
        db: Session,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[SupportTicketResponse]:
        """
        List all tickets (Admin dashboard) with query filters.
        """
        query = db.query(SupportTicket)
        
        if status_filter:
            # Handle list status like "Open Tickets" vs "Closed"
            if status_filter.upper() == "OPEN_DESK":
                query = query.filter(SupportTicket.status.in_(["OPEN", "IN_PROGRESS", "ASSIGNED"]))
            else:
                query = query.filter(SupportTicket.status == status_filter.upper())
                
        if priority_filter:
            query = query.filter(SupportTicket.priority == priority_filter.upper())
            
        if category_filter:
            query = query.filter(SupportTicket.category == category_filter)
            
        if search_query:
            q = f"%{search_query}%"
            # Join with user to search in name/email
            query = query.join(User, SupportTicket.created_by_id == User.id).filter(
                or_(
                    SupportTicket.issue.like(q),
                    SupportTicket.description.like(q),
                    User.name.like(q),
                    User.email.like(q)
                )
            )
            
        tickets = query.order_by(SupportTicket.created_at.desc()).all()
        return [SupportService._to_ticket_response(t) for t in tickets]

    @staticmethod
    def get_ticket_by_id(db: Session, ticket_id: str) -> SupportTicketResponse:
        """
        Fetches details of a single support ticket.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == uuid.UUID(ticket_id)).first()
        if not ticket:
            raise ValueError("Ticket not found")
        return SupportService._to_ticket_response(ticket)

    @staticmethod
    def assign_ticket(db: Session, ticket_id: str, admin_id: str) -> SupportTicketResponse:
        """
        Assigns support ticket to an administrator.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == uuid.UUID(ticket_id)).first()
        if not ticket:
            raise ValueError("Ticket not found")
            
        ticket.assigned_to_id = uuid.UUID(admin_id)
        ticket.status = "ASSIGNED"
        db.commit()
        db.refresh(ticket)
        
        # Notify the creator (fellow user)
        NotificationService.create_notification(
            db=db,
            user_id=str(ticket.created_by_id),
            title="Support Ticket Assigned",
            message=f"Your ticket '{ticket.issue}' has been assigned to an administrator.",
            type="info",
            action_path=f"/my-tickets",
            action_label="View tickets"
        )
        
        return SupportService._to_ticket_response(ticket)

    @staticmethod
    def update_status(db: Session, ticket_id: str, status: str) -> SupportTicketResponse:
        """
        Updates support ticket status, and triggers notification/email if resolved.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == uuid.UUID(ticket_id)).first()
        if not ticket:
            raise ValueError("Ticket not found")
            
        old_status = ticket.status
        new_status = status.upper()
        ticket.status = new_status
        
        if new_status == "RESOLVED":
            ticket.resolved_at = datetime.now(timezone.utc)
            
            # Send Resolution Email and Notification
            creator = ticket.creator
            email_body = f"Hello {creator.name},\n\nWe are pleased to inform you that your support ticket '{ticket.issue}' has been resolved.\n\nBest regards,\nERP Support Team"
            EmailService.send_email(
                db=db,
                recipient_email=creator.email,
                subject=f"Resolved: Support Ticket {ticket.issue}",
                body=email_body
            )
            
            NotificationService.create_notification(
                db=db,
                user_id=str(ticket.created_by_id),
                title="Support Ticket Resolved",
                message=f"Your ticket '{ticket.issue}' has been resolved.",
                type="success",
                action_path=f"/my-tickets",
                action_label="Check status"
            )

            # Delete notifications related to this ticket for admin
            from app.common.models.notification import Notification
            db.query(Notification).filter(
                Notification.action_path == f"/admin/support/ticket/{ticket_id}"
            ).delete(synchronize_session=False)

            # Generate the response model representation before we delete the DB row
            ticket_response = SupportService._to_ticket_response(ticket)
            
            db.delete(ticket)
            db.commit()
            return ticket_response
        elif new_status == "CLOSED":
            ticket.closed_at = datetime.now(timezone.utc)
            
        db.commit()
        db.refresh(ticket)
        return SupportService._to_ticket_response(ticket)

    @staticmethod
    def add_message(
        db: Session, 
        ticket_id: str, 
        message: str, 
        attachments: Optional[List[Dict[str, Any]]] = None,
        is_admin_reply: bool = False,
        sender_id: str = None
    ) -> SupportTicketMessageResponse:
        """
        Adds a message reply to the ticket, updates status, and notifies recipient.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == uuid.UUID(ticket_id)).first()
        if not ticket:
            raise ValueError("Ticket not found")
            
        msg = SupportTicketMessage(
            ticket_id=uuid.UUID(ticket_id),
            sender_id=uuid.UUID(sender_id),
            message=message,
            is_admin_reply=is_admin_reply,
            attachments=json.dumps(attachments) if attachments else None
        )
        db.add(msg)
        
        # Update ticket status if user replies to admin or admin replies to user
        if is_admin_reply:
            ticket.status = "IN_PROGRESS"
            # Notify creator
            NotificationService.create_notification(
                db=db,
                user_id=str(ticket.created_by_id),
                title="New Support Message from Admin",
                message=f"Admin replied to ticket '{ticket.issue}': {message[:50]}...",
                type="info",
                action_path=f"/my-tickets",
                action_label="Open Ticket"
            )
        else:
            ticket.status = "OPEN"
            # Notify assigned admin or broadcast to admins
            if ticket.assigned_to_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=str(ticket.assigned_to_id),
                    title="User Replied to Support Ticket",
                    message=f"User replied: {message[:50]}...",
                    type="info",
                    action_path=f"/admin/support/ticket/{ticket.id}",
                    action_label="Open Thread"
                )
            else:
                NotificationService.broadcast_notification(
                    db=db,
                    title="User Replied to Support Ticket",
                    message=f"User replied on '{ticket.issue}': {message[:50]}...",
                    type="info",
                    roles=[RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value],
                    action_path=f"/admin/support/ticket/{ticket.id}",
                    action_label="Open Thread"
                )
                
        db.commit()
        db.refresh(msg)
        
        return SupportTicketMessageResponse(
            id=str(msg.id),
            ticket_id=str(msg.ticket_id),
            sender=SupportService._to_user_mini(msg.sender),
            message=msg.message,
            attachments=attachments or [],
            created_at=msg.created_at.isoformat(),
            is_admin_reply=msg.is_admin_reply
        )

    @staticmethod
    def update_notes(db: Session, ticket_id: str, notes: str) -> SupportTicketResponse:
        """
        Updates internal admin notes for the ticket.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == uuid.UUID(ticket_id)).first()
        if not ticket:
            raise ValueError("Ticket not found")
            
        ticket.admin_notes = notes
        db.commit()
        db.refresh(ticket)
        return SupportService._to_ticket_response(ticket)

    @staticmethod
    def escalate_ticket(db: Session, ticket_id: str, reason: str) -> SupportTicketResponse:
        """
        Escalates support ticket to CRITICAL priority and appends internal note.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == uuid.UUID(ticket_id)).first()
        if not ticket:
            raise ValueError("Ticket not found")
            
        ticket.priority = "CRITICAL"
        ticket.admin_notes = f"Escalated due to: {reason}\n\n{ticket.admin_notes or ''}"
        db.commit()
        db.refresh(ticket)
        
        # Broadcast escalation to Super Admins
        NotificationService.broadcast_notification(
            db=db,
            title="Support Ticket Escalated",
            message=f"Ticket '{ticket.issue}' was escalated to CRITICAL: {reason}",
            type="error",
            roles=[RoleEnum.SUPER_ADMIN.value],
            action_path=f"/admin/support/ticket/{ticket.id}",
            action_label="Review escalation"
        )
        
        return SupportService._to_ticket_response(ticket)

    # ============ FEATURE REQUESTS ============

    @staticmethod
    def _to_feature_request_response(fr: FeatureRequestModel) -> FeatureRequestResponse:
        return FeatureRequestResponse(
            id=str(fr.id),
            request_id=fr.request_id,
            requested_by=SupportService._to_user_mini(fr.creator),
            title=fr.title,
            description=fr.description,
            benefit=fr.benefit,
            votes=fr.votes,
            status=fr.status,
            created_at=fr.created_at.isoformat(),
            updated_at=fr.updated_at.isoformat() if fr.updated_at else fr.created_at.isoformat(),
            comments=fr.comments
        )

    @staticmethod
    def create_feature_request(
        db: Session,
        payload: FeatureRequestCreate,
        user_id: str
    ) -> FeatureRequestResponse:
        count = db.query(FeatureRequestModel).count()
        req_id = f"FR-{count + 1:03d}"
        
        fr = FeatureRequestModel(
            request_id=req_id,
            title=payload.title,
            description=payload.description,
            benefit=payload.benefit,
            votes=1,
            status="Open",
            created_by_id=uuid.UUID(user_id)
        )
        db.add(fr)
        db.commit()
        db.refresh(fr)

        # Notify Admin real-time
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        user_name = user.name if user else "Fellow User"
        NotificationService.broadcast_notification(
            db=db,
            title="New Feature Request Submitted",
            message=f"{user_name} requested feature: '{payload.title}'",
            type="info",
            roles=[RoleEnum.ADMIN.value, RoleEnum.SUPER_ADMIN.value],
            action_path="/admin/support/feature-requests",
            action_label="View feature request"
        )

        return SupportService._to_feature_request_response(fr)

    @staticmethod
    def list_feature_requests(db: Session) -> List[FeatureRequestResponse]:
        requests = db.query(FeatureRequestModel).order_by(FeatureRequestModel.created_at.desc()).all()
        return [SupportService._to_feature_request_response(r) for r in requests]

    @staticmethod
    def update_feature_request_status(
        db: Session,
        request_id: str,
        status: str,
        comments: Optional[str] = None
    ) -> FeatureRequestResponse:
        fr = db.query(FeatureRequestModel).filter(
            or_(
                FeatureRequestModel.id == uuid.UUID(request_id) if len(request_id) == 36 else False,
                FeatureRequestModel.request_id == request_id
            )
        ).first()
        if not fr:
            raise ValueError("Feature request not found")

        fr.status = status
        if comments:
            fr.comments = comments
        db.commit()
        db.refresh(fr)
        return SupportService._to_feature_request_response(fr)

    @staticmethod
    def vote_feature_request(db: Session, request_id: str) -> FeatureRequestResponse:
        fr = db.query(FeatureRequestModel).filter(
            or_(
                FeatureRequestModel.id == uuid.UUID(request_id) if len(request_id) == 36 else False,
                FeatureRequestModel.request_id == request_id
            )
        ).first()
        if not fr:
            raise ValueError("Feature request not found")

        fr.votes += 1
        db.commit()
        db.refresh(fr)
        return SupportService._to_feature_request_response(fr)

