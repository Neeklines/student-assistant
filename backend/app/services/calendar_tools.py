"""Pure-Python tool functions exposed to the AI agent.

Each function takes (db, user_id, **params) and returns a JSON-serializable dict.
They mirror the REST calendar endpoints but skip the HTTP layer so the LLM
dispatch loop can call them directly.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.calendar_event import CalendarEvent


def _serialize_event(event: CalendarEvent) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_time": event.start_time.isoformat() if event.start_time else None,
        "end_time": event.end_time.isoformat() if event.end_time else None,
        "event_type": event.event_type,
        "priority": event.priority,
        "status": event.status,
        "created_by": event.created_by,
    }


def _parse_dt(value: str, field: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError(
            f"{field} must be ISO 8601, got {value!r}. Example: 2026-06-06T14:00:00"
        )


def list_events(
    db: Session,
    user_id: int,
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> dict:
    """List the user's events, optionally filtered by an inclusive date range."""
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id)

    if start:
        query = query.filter(CalendarEvent.start_time >= _parse_dt(start, "start"))
    if end:
        query = query.filter(CalendarEvent.start_time <= _parse_dt(end, "end"))

    rows = query.order_by(CalendarEvent.start_time).all()
    return {"events": [_serialize_event(e) for e in rows]}


def create_event(
    db: Session,
    user_id: int,
    title: str,
    start_time: str,
    end_time: str,
    description: Optional[str] = None,
    event_type: str = "study",
    priority: str = "medium",
    status: str = "planned",
) -> dict:
    """Create a new event for the user."""
    if not title or not title.strip():
        raise ValueError("title is required")

    start_dt = _parse_dt(start_time, "start_time")
    end_dt = _parse_dt(end_time, "end_time")
    if end_dt <= start_dt:
        raise ValueError("end_time must be after start_time")

    event = CalendarEvent(
        user_id=user_id,
        title=title.strip(),
        description=description,
        start_time=start_dt,
        end_time=end_dt,
        event_type=event_type,
        priority=priority,
        status=status,
        created_by="ai",
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"event": _serialize_event(event)}


def update_event(
    db: Session,
    user_id: int,
    event_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    event_type: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
) -> dict:
    """Update fields on one of the user's events. Only provided fields are touched."""
    event = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == user_id,
        )
        .first()
    )
    if not event:
        return {"error": f"event {event_id} not found"}

    if title is not None:
        event.title = title
    if description is not None:
        event.description = description
    if start_time is not None:
        event.start_time = _parse_dt(start_time, "start_time")
    if end_time is not None:
        event.end_time = _parse_dt(end_time, "end_time")
    if event_type is not None:
        event.event_type = event_type
    if priority is not None:
        event.priority = priority
    if status is not None:
        event.status = status

    if event.end_time <= event.start_time:
        raise ValueError("end_time must be after start_time")

    db.commit()
    db.refresh(event)
    return {"event": _serialize_event(event)}


def delete_event(db: Session, user_id: int, event_id: int) -> dict:
    """Delete one of the user's events. Returns success or not-found."""
    event = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == user_id,
        )
        .first()
    )
    if not event:
        return {"error": f"event {event_id} not found"}

    db.delete(event)
    db.commit()
    return {"deleted": event_id}


# JSON Schema definitions consumed by OpenAI tool calling.
OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_events",
            "description": (
                "List the student's calendar events, optionally within an ISO 8601 "
                "date/time range. Use this to understand what is already planned "
                "before suggesting or adding anything."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "start": {
                        "type": "string",
                        "description": "Inclusive lower bound, ISO 8601. Optional.",
                    },
                    "end": {
                        "type": "string",
                        "description": "Inclusive upper bound, ISO 8601. Optional.",
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_event",
            "description": (
                "Add a new event to the student's calendar. Confirm with the student "
                "before calling this if the request is ambiguous. Do not use this to "
                "create travel/commute events (e.g. 'dojazd', 'travel') unless the "
                "user explicitly asks for one — travel time should be left as a gap, "
                "not an event."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "start_time": {
                        "type": "string",
                        "description": "ISO 8601 start, e.g. 2026-06-07T09:00:00",
                    },
                    "end_time": {
                        "type": "string",
                        "description": "ISO 8601 end, must be after start_time",
                    },
                    "description": {"type": "string"},
                    "event_type": {
                        "type": "string",
                        "description": (
                            "Daily planning category. Prefer one of: 'lecture' "
                            "(classes), 'study', 'task', 'deadline', 'meeting', "
                            "'work', 'personal', 'health', 'break', 'custom'."
                        ),
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                    },
                    "status": {
                        "type": "string",
                        "enum": ["planned", "done", "cancelled"],
                    },
                },
                "required": ["title", "start_time", "end_time"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_event",
            "description": (
                "Modify an existing event. Only fields provided will be updated."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "integer"},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "start_time": {"type": "string"},
                    "end_time": {"type": "string"},
                    "event_type": {"type": "string"},
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                    },
                    "status": {
                        "type": "string",
                        "enum": ["planned", "done", "cancelled"],
                    },
                },
                "required": ["event_id"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_event",
            "description": (
                "Remove an event. Always ask the student to confirm before calling."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "event_id": {"type": "integer"},
                },
                "required": ["event_id"],
                "additionalProperties": False,
            },
        },
    },
]


TOOL_FUNCTIONS = {
    "list_events": list_events,
    "create_event": create_event,
    "update_event": update_event,
    "delete_event": delete_event,
}
