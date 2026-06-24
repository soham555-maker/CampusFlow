from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class StudentClassCreate(BaseModel):
    student_id: UUID
    class_id: UUID


class StudentClassJoin(BaseModel):
    join_code: str


class StudentClassResponse(BaseModel):
    id: UUID
    student_id: UUID
    class_id: UUID
    enrolled_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
