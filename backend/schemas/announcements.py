from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class AnnouncementCreate(BaseModel):
    class_id: UUID
    title: str
    body: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None


class AnnouncementResponse(BaseModel):
    id: UUID
    class_id: UUID
    teacher_id: UUID
    title: str
    body: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
