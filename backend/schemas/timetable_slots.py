from pydantic import BaseModel
from uuid import UUID
from datetime import time, datetime
from typing import Optional


class TimetableSlotCreate(BaseModel):
    class_id: UUID
    classroom_id: UUID
    day: str
    start_time: time
    end_time: time
    # teacher_id and term_id are auto-synced from the class by the DB trigger


class TimetableSlotUpdate(BaseModel):
    classroom_id: Optional[UUID] = None
    day: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class TimetableSlotResponse(BaseModel):
    id: UUID
    class_id: UUID
    classroom_id: UUID
    teacher_id: UUID
    term_id: UUID
    day: str
    start_time: time
    end_time: time
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
