from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventRead

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events", response_model=list[CalendarEventRead])
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CalendarEvent)
        .filter(CalendarEvent.user_id == current_user.id)
        .order_by(CalendarEvent.start_time)
        .all()
    )


@router.post("/events", response_model=CalendarEventRead)
def create_event(
    event: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_event = CalendarEvent(user_id=current_user.id, **event.model_dump())

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return db_event


@router.put("/events/{event_id}", response_model=CalendarEventRead)
def update_event(
    event_id: int,
    updated_event: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == current_user.id,
        )
        .first()
    )

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    data = updated_event.model_dump()

    for key, value in data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)

    return event


@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.id == event_id,
            CalendarEvent.user_id == current_user.id,
        )
        .first()
    )

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    return {"message": "Event deleted"}
