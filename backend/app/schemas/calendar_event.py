from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    event_type: str = "study"
    priority: str = "medium"
    status: str = "planned"
    created_by: str = "manual"


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventRead(CalendarEventBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
