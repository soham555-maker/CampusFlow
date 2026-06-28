from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.teachers import TeacherCreate, TeacherUpdate, TeacherResponse
from auth.guards import require_admin
from config import get_supabase
from utils.db import fetch_one

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("", response_model=List[TeacherResponse])
def list_teachers(user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("teachers").select("*").order("full_name").execute()
    return res.data


@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    row = fetch_one(supabase.table("teachers").select("*").eq("id", teacher_id))
    if not row:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return row


@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(body: TeacherCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    data = body.model_dump(exclude_none=True)
    res = supabase.table("teachers").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create teacher")
    return res.data[0]


@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(teacher_id: str, body: TeacherUpdate, user=Depends(require_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = supabase.table("teachers").update(update_data).eq("id", teacher_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return res.data[0]


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("teachers").delete().eq("id", teacher_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Teacher not found")
