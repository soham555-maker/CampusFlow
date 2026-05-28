from fastapi import APIRouter, HTTPException, Depends
from schemas.timetable import TimetableSlotCreate, TimetableSlotResponse
from utils.conflict import check_timetable_conflict
from config import get_supabase
from typing import List

router = APIRouter(prefix="/timetable", tags=["timetable"])

@router.post("/conflicts/check")
def check_conflict(slot: TimetableSlotCreate):
    supabase = get_supabase()
    result = check_timetable_conflict(supabase, slot.model_dump())
    return result

@router.post("/", response_model=TimetableSlotResponse)
def create_slot(slot: TimetableSlotCreate):
    supabase = get_supabase()
    
    # 1. API level conflict check
    conflict = check_timetable_conflict(supabase, slot.model_dump())
    if conflict["has_conflict"]:
        raise HTTPException(status_code=400, detail=conflict["reason"])
    
    # 2. Insert into DB (DB level EXCLUDE constraint will also protect)
    data = slot.model_dump()
    data["class_id"] = str(data["class_id"])
    data["classroom_id"] = str(data["classroom_id"])
    data["teacher_id"] = str(data["teacher_id"])
    data["term_id"] = str(data["term_id"])
    data["start_time"] = data["start_time"].isoformat()
    data["end_time"] = data["end_time"].isoformat()

    res = supabase.table("timetable_slots").insert(data).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create slot.")
    
    return res.data[0]

@router.get("/", response_model=List[TimetableSlotResponse])
def get_slots(term_id: str = None):
    supabase = get_supabase()
    query = supabase.table("timetable_slots").select("*")
    if term_id:
        query = query.eq("term_id", term_id)
    res = query.execute()
    return res.data
