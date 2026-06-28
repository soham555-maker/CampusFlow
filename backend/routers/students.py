from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.students import StudentCreate, StudentUpdate, StudentResponse
from auth.dependencies import get_current_user, get_user_role
from auth.guards import require_admin
from config import get_supabase
from utils.db import fetch_one

router = APIRouter(prefix="/students", tags=["students"])


def _get_student_by_uid(uid: str):
    supabase = get_supabase()
    return fetch_one(supabase.table("students").select("*").eq("user_id", uid))


# ── Student self-service ──────────────────────────────────────────────────────

@router.get("/me", response_model=StudentResponse)
def get_my_profile(user=Depends(get_current_user)):
    row = _get_student_by_uid(user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return row


@router.put("/me", response_model=StudentResponse)
def update_my_profile(body: StudentUpdate, user=Depends(get_current_user)):
    supabase = get_supabase()
    row = _get_student_by_uid(user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Student profile not found")
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        return row
    res = supabase.table("students").update(update_data).eq("id", row["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return res.data[0]


# ── Admin management ──────────────────────────────────────────────────────────

@router.get("", response_model=List[StudentResponse])
def list_students(user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("students").select("*").order("full_name").execute()
    return res.data


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    row = fetch_one(supabase.table("students").select("*").eq("id", student_id))
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    return row


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(body: StudentCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    data = body.model_dump(exclude_none=True)
    res = supabase.table("students").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create student")
    return res.data[0]


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, body: StudentUpdate, user=Depends(require_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = supabase.table("students").update(update_data).eq("id", student_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
    return res.data[0]


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("students").delete().eq("id", student_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")
