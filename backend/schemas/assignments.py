from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class AssignmentCreate(BaseModel):
    class_id: UUID
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_marks: Optional[int] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_marks: Optional[int] = None


class AssignmentResponse(BaseModel):
    id: UUID
    class_id: UUID
    teacher_id: UUID
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_marks: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
