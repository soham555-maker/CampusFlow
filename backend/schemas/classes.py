from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class ClassCreate(BaseModel):
    subject_id: UUID
    teacher_id: UUID
    term_id: UUID
    semester: Optional[int] = None
    division: Optional[str] = None


class ClassUpdate(BaseModel):
    subject_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    term_id: Optional[UUID] = None
    semester: Optional[int] = None
    division: Optional[str] = None


class ClassResponse(BaseModel):
    id: UUID
    subject_id: UUID
    teacher_id: UUID
    term_id: UUID
    semester: Optional[int] = None
    division: Optional[str] = None
    join_code: Optional[str] = None
    # Joined display fields (populated via select with joins)
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None
    student_count: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
