from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from schemas.marks import MarkCreate, MarkUpdate, MarkResponse
from auth.guards import require_teacher_or_admin, require_authenticated
from config import get_supabase
from utils.db import fetch_one

router = APIRouter(prefix="/marks", tags=["marks"])


@router.get("", response_model=List[MarkResponse])
def list_marks_for_assignment(
    assignment_id: Optional[str] = None, user=Depends(require_teacher_or_admin)
):
    supabase = get_supabase()
    query = supabase.table("marks").select("*")
    if assignment_id:
        query = query.eq("assignment_id", assignment_id)
    res = query.execute()
    return res.data


@router.get("/student/{student_id}", response_model=List[MarkResponse])
def list_marks_for_student(student_id: str, user=Depends(require_authenticated)):
    supabase = get_supabase()
    res = (
        supabase.table("marks")
        .select("*")
        .eq("student_id", student_id)
        .order("submitted_at", desc=True)
        .execute()
    )
    return res.data


@router.post("", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
def create_mark(body: MarkCreate, user=Depends(require_teacher_or_admin)):
    supabase = get_supabase()
    data = body.model_dump(exclude_none=True)
    data["assignment_id"] = str(data["assignment_id"])
    data["student_id"] = str(data["student_id"])
    if "marks_obtained" in data and data["marks_obtained"] is not None:
        data["marks_obtained"] = float(data["marks_obtained"])
    # Check for duplicate (assignment_id + student_id must be unique)
    existing = fetch_one(
        supabase.table("marks")
        .select("id")
        .eq("assignment_id", data["assignment_id"])
        .eq("student_id", data["student_id"])
    )
    if existing:
        raise HTTPException(status_code=409, detail="Mark already exists for this student and assignment")
    res = supabase.table("marks").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to record mark")
    return res.data[0]


@router.put("/{mark_id}", response_model=MarkResponse)
def update_mark(mark_id: str, body: MarkUpdate, user=Depends(require_teacher_or_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "marks_obtained" in update_data and update_data["marks_obtained"] is not None:
        update_data["marks_obtained"] = float(update_data["marks_obtained"])
    res = supabase.table("marks").update(update_data).eq("id", mark_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Mark not found")
    return res.data[0]
