from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    event_type = Column(String(50), default="study")
    priority = Column(String(50), default="medium")
    status = Column(String(50), default="planned")
    created_by = Column(String(50), default="manual")
