import uuid
from datetime import datetime, date, time as time_cls, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.common.constants.enums import RoleEnum, EventStatusEnum
from app.common.models.event import Event
from app.common.models.project import Project
from app.common.models.role import Role
from app.common.models.user import User
from app.events.schemas import EventCreate, EventUpdate, EventResponse
from app.shared.logger import get_logger

logger = get_logger(__name__)


class EventService:
    @staticmethod
    def _role_name(user: User, db: Optional[Session] = None) -> str:
        if user.role and user.role.name:
            return user.role.name.strip().upper()

        if db is not None and getattr(user, "role_id", None):
            role = db.query(Role).filter(Role.id == user.role_id).first()
            if role and role.name:
                return role.name.strip().upper()

        return ""

    @staticmethod
    def _ensure_access(current_user: User, db: Optional[Session] = None, write: bool = False) -> None:
        role = EventService._role_name(current_user, db)
        # Allowed roles for viewing the Events module
        allowed_view_roles = {RoleEnum.SUPER_ADMIN.value, RoleEnum.ADMIN.value, RoleEnum.ACCOUNTS.value, RoleEnum.USER.value}
        if role not in allowed_view_roles:
            logger.info("Events access denied: user=%s role=%s allowed=%s", getattr(current_user, 'id', None), role, allowed_view_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to the Events module.",
            )

        # Allowed roles for write operations (create/update/cancel)
        allowed_write_roles = {RoleEnum.SUPER_ADMIN.value, RoleEnum.ADMIN.value}
        if write and role not in allowed_write_roles:
            logger.info("Events write denied: user=%s role=%s allowed_write=%s", getattr(current_user, 'id', None), role, allowed_write_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admin or Super Admin users can manage events.",
            )

    @staticmethod
    def _event_code(seed: uuid.UUID) -> str:
        return f"EVT-{str(seed).replace('-', '')[:10].upper()}"

    @staticmethod
    def _normalize_status(value: Optional[str]) -> str:
        if not value:
            return EventStatusEnum.UPCOMING.value
        normalized = value.strip().upper()
        allowed = {item.value for item in EventStatusEnum}
        return normalized if normalized in allowed else EventStatusEnum.UPCOMING.value

    @staticmethod
    def _safe_datetime(value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)

    @staticmethod
    def _response(event: Event) -> EventResponse:
        creator_name = event.created_by_user.name if event.created_by_user else "Unknown"
        canceller_name = event.cancelled_by_user.name if event.cancelled_by_user else None

        event_code = event.event_id or EventService._event_code(event.id)
        event_type = event.event_type or "General"
        event_date = event.event_date or date.today()
        event_time = event.event_time or time_cls(hour=0, minute=0)
        created_at = EventService._safe_datetime(event.created_at) or datetime.now(timezone.utc)
        updated_at = EventService._safe_datetime(event.updated_at) or created_at

        return EventResponse(
            id=str(event.id),
            event_id=event_code,
            title=event.title,
            type=event_type,
            date=event_date,
            time=event_time,
            venue=event.venue or "—",
            coordinator=event.coordinator or "—",
            description=event.description,
            status=EventService._normalize_status(event.status),
            created_by=creator_name,
            created_at=created_at,
            updated_at=updated_at,
            cancelled_by=canceller_name,
            cancelled_at=EventService._safe_datetime(event.cancelled_at),
            cancel_reason=event.cancel_reason,
        )

    @staticmethod
    def _unique_event_code(db: Session) -> str:
        today_prefix = datetime.now().strftime("%Y%m%d")
        suffix = uuid.uuid4().hex[:4].upper()
        candidate = f"EVT-{today_prefix}-{suffix}"
        while db.query(Event).filter(Event.event_id == candidate).first():
            suffix = uuid.uuid4().hex[:4].upper()
            candidate = f"EVT-{today_prefix}-{suffix}"
        return candidate

    @staticmethod
    def _resolve_project_id(db: Session, current_user: User) -> uuid.UUID:
        if getattr(current_user, "project_id", None):
            return current_user.project_id

        fallback_project = db.query(Project).order_by(Project.created_at.asc()).first()
        if fallback_project:
            return fallback_project.id

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No project is available to link the event record.",
        )

    @staticmethod
    def list_events(
        db: Session,
        current_user: User,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> List[EventResponse]:
        EventService._ensure_access(current_user, db=db, write=False)
        query = db.query(Event)
        role = EventService._role_name(current_user, db=db)

        if search:
            term = f"%{search.strip()}%"
            search_terms = [
                Event.title.ilike(term),
                Event.venue.ilike(term),
                Event.coordinator.ilike(term),
            ]
            if role == RoleEnum.ADMIN.value:
                search_terms.append(Event.event_id.ilike(term))
            query = query.filter(or_(*search_terms))

        if role == RoleEnum.USER.value:
            query = query.filter(Event.status != EventStatusEnum.CANCELLED.value)

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Event.status == status_filter.upper())

        events = query.order_by(Event.event_date.asc(), Event.event_time.asc()).all()
        return [EventService._response(event) for event in events]

    @staticmethod
    def get_event(db: Session, event_uuid: str, current_user: User) -> EventResponse:
        EventService._ensure_access(current_user, db=db, write=False)
        try:
            event_id = uuid.UUID(event_uuid)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id") from exc

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return EventService._response(event)

    @staticmethod
    def create_event(db: Session, current_user: User, payload: EventCreate) -> EventResponse:
        EventService._ensure_access(current_user, db=db, write=True)

        event = Event(
            project_id=EventService._resolve_project_id(db, current_user),
            event_id=payload.event_id.strip() if payload.event_id and payload.event_id.strip() else EventService._unique_event_code(db),
            title=payload.title.strip(),
            event_type=payload.event_type.strip(),
            event_date=payload.date,
            event_time=payload.time,
            venue=payload.venue.strip(),
            coordinator_id=current_user.id,
            coordinator=payload.coordinator.strip(),
            description=payload.description.strip() if payload.description else None,
            status=EventService._normalize_status(payload.status),
            created_by_id=current_user.id,
            legacy_event_date=datetime.combine(payload.date, payload.time).replace(tzinfo=timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db.add(event)
        db.commit()
        db.refresh(event)
        return EventService._response(event)

    @staticmethod
    def update_event(db: Session, event_uuid: str, current_user: User, payload: EventUpdate) -> EventResponse:
        EventService._ensure_access(current_user, db=db, write=True)
        try:
            event_id = uuid.UUID(event_uuid)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id") from exc

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        if EventService._normalize_status(event.status) in {EventStatusEnum.COMPLETED.value, EventStatusEnum.CANCELLED.value}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed or cancelled events are read-only.",
            )

        now = datetime.now()
        scheduled_at = datetime.combine(event.event_date, event.event_time)
        if scheduled_at <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only future events can be edited.",
            )

        updates = payload.model_dump(exclude_unset=True, by_alias=True)
        if "event_id" in updates and updates["event_id"]:
            candidate = updates["event_id"].strip()
            existing = db.query(Event).filter(Event.event_id == candidate, Event.id != event_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event ID already exists")
            event.event_id = candidate
        if "title" in updates and updates["title"] is not None:
            event.title = updates["title"].strip()
        if "type" in updates and updates["type"] is not None:
            event.event_type = updates["type"].strip()
        if "date" in updates and updates["date"] is not None:
            event.event_date = updates["date"]
        if "time" in updates and updates["time"] is not None:
            event.event_time = updates["time"]
        if "venue" in updates and updates["venue"] is not None:
            event.venue = updates["venue"].strip()
        if "coordinator" in updates and updates["coordinator"] is not None:
            event.coordinator = updates["coordinator"].strip()
        if "description" in updates:
            event.description = updates["description"].strip() if updates["description"] else None
        if "status" in updates and updates["status"] is not None:
            event.status = EventService._normalize_status(updates["status"])

        event.legacy_event_date = datetime.combine(event.event_date, event.event_time).replace(tzinfo=timezone.utc)

        event.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)
        return EventService._response(event)

    @staticmethod
    def cancel_event(db: Session, event_uuid: str, current_user: User, reason: Optional[str] = None) -> EventResponse:
        EventService._ensure_access(current_user, db=db, write=True)
        try:
            event_id = uuid.UUID(event_uuid)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id") from exc

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        event.status = EventStatusEnum.CANCELLED.value
        event.cancelled_by_id = current_user.id
        event.cancelled_at = datetime.now(timezone.utc)
        event.cancel_reason = reason.strip() if reason else None
        event.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(event)
        return EventService._response(event)

    @staticmethod
    def delete_event(db: Session, event_uuid: str, current_user: User) -> dict:
        EventService._ensure_access(current_user, db=db, write=True)
        try:
            event_id = uuid.UUID(event_uuid)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid event id") from exc

        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        db.delete(event)
        db.commit()
        return {"message": "Event deleted successfully"}

