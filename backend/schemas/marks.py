from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from decimal import Decimal


class MarkCreate(BaseModel):
    assignment_id: UUID
    student_id: UUID
    marks_obtained: Optional[Decimal] = None
    feedback: Optional[str] = None


class MarkUpdate(BaseModel):
    marks_obtained: Optional[Decimal] = None
    feedback: Optional[str] = None


class MarkResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    student_id: UUID
    marks_obtained: Optional[Decimal] = None
    feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
