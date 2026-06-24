from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    division: Optional[str] = None
    year: Optional[int] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    division: Optional[str] = None
    year: Optional[int] = None


class StudentResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    division: Optional[str] = None
    year: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
