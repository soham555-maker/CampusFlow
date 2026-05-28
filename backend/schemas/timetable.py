from pydantic import BaseModel
from uuid import UUID
from datetime import time
from typing import Optional

class TimetableSlotBase(BaseModel):
    class_id: UUID
    classroom_id: UUID
    day: str
    start_time: time
    end_time: time

class TimetableSlotCreate(TimetableSlotBase):
    teacher_id: UUID
    term_id: UUID

class TimetableSlotResponse(TimetableSlotBase):
    id: UUID
    teacher_id: UUID
    term_id: UUID

    class Config:
        from_attributes = True
