from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.common.models.user import User
from app.events.schemas import EventCancelRequest, EventCreate, EventResponse, EventUpdate
from app.events.services import EventService
from app.shared.responses import ResponseEnvelope, make_success_response


router = APIRouter(prefix="/events", tags=["Events"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=ResponseEnvelope[EventResponse])
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        event = EventService.create_event(db=db, current_user=current_user, payload=payload)
        return make_success_response(event)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("", response_model=ResponseEnvelope[List[EventResponse]])
def list_events(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        events = EventService.list_events(
            db=db,
            current_user=current_user,
            search=search,
            status_filter=status_filter,
        )
        return make_success_response(events)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{event_id}", response_model=ResponseEnvelope[EventResponse])
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        event = EventService.get_event(db=db, event_uuid=event_id, current_user=current_user)
        return make_success_response(event)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.put("/{event_id}", response_model=ResponseEnvelope[EventResponse])
def update_event(
    event_id: str,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        event = EventService.update_event(db=db, event_uuid=event_id, current_user=current_user, payload=payload)
        return make_success_response(event)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.patch("/{event_id}/cancel", response_model=ResponseEnvelope[EventResponse])
def cancel_event(
    event_id: str,
    payload: EventCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        event = EventService.cancel_event(
            db=db,
            event_uuid=event_id,
            current_user=current_user,
            reason=payload.reason,
        )
        return make_success_response(event)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/{event_id}", response_model=ResponseEnvelope[dict])
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        res = EventService.delete_event(
            db=db,
            event_uuid=event_id,
            current_user=current_user,
        )
        return make_success_response(res)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

