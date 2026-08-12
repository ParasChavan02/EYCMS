from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class EventBase(BaseModel):
    event_id: Optional[str] = Field(None, alias="event_id")
    title: str
    event_type: str = Field(..., alias="type")
    date: date
    time: time
    venue: str
    coordinator: str
    description: Optional[str] = None
    status: Optional[str] = "UPCOMING"

    model_config = ConfigDict(populate_by_name=True)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    event_id: Optional[str] = Field(None, alias="event_id")
    title: Optional[str] = None
    event_type: Optional[str] = Field(None, alias="type")
    date: Optional[date] = None
    time: Optional[time] = None
    venue: Optional[str] = None
    coordinator: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class EventCancelRequest(BaseModel):
    reason: Optional[str] = Field(None, alias="cancel_reason")

    model_config = ConfigDict(populate_by_name=True)


class EventResponse(BaseModel):
    id: str
    eventId: str = Field(..., alias="event_id")
    title: str
    eventType: str = Field(..., alias="type")
    date: date
    time: time
    venue: str
    coordinator: str
    description: Optional[str] = None
    status: str
    createdBy: str = Field(..., alias="created_by")
    createdAt: datetime = Field(..., alias="created_at")
    updatedAt: datetime = Field(..., alias="updated_at")
    cancelledBy: Optional[str] = Field(None, alias="cancelled_by")
    cancelledAt: Optional[datetime] = Field(None, alias="cancelled_at")
    cancelReason: Optional[str] = Field(None, alias="cancel_reason")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

