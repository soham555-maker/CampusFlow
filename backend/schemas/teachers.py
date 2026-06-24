from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


class TeacherCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    qualifications: Optional[List[str]] = None
    bio: Optional[str] = None


class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    qualifications: Optional[List[str]] = None
    bio: Optional[str] = None


class TeacherResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    qualifications: Optional[List[str]] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
