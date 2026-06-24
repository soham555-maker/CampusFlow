from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List, Any
from datetime import datetime


class ClassroomCreate(BaseModel):
    room_number: str
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    amenities: Optional[List[str]] = None


class ClassroomUpdate(BaseModel):
    room_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    amenities: Optional[List[str]] = None


class ClassroomResponse(BaseModel):
    id: UUID
    room_number: str
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    amenities: Optional[List[str]] = None
    coordinates: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
