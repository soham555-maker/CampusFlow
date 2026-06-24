from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.subjects import SubjectCreate, SubjectUpdate, SubjectResponse
from auth.guards import require_admin
from config import get_supabase

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=List[SubjectResponse])
def list_subjects(user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("subjects").select("*").order("subject_name").execute()
    return res.data


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(body: SubjectCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    data = body.model_dump(exclude_none=True)
    res = supabase.table("subjects").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create subject")
    return res.data[0]


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: str, body: SubjectUpdate, user=Depends(require_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = supabase.table("subjects").update(update_data).eq("id", subject_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    return res.data[0]


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("subjects").delete().eq("id", subject_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Subject not found")
