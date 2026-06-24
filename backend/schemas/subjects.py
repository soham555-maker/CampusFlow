from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class SubjectCreate(BaseModel):
    subject_name: str
    subject_code: str
    credits: Optional[int] = None
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    credits: Optional[int] = None
    description: Optional[str] = None


class SubjectResponse(BaseModel):
    id: UUID
    subject_name: str
    subject_code: str
    credits: Optional[int] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
