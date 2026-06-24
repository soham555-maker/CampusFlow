from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.classrooms import ClassroomCreate, ClassroomUpdate, ClassroomResponse
from auth.guards import require_admin
from config import get_supabase

router = APIRouter(prefix="/classrooms", tags=["classrooms"])


@router.get("", response_model=List[ClassroomResponse])
def list_classrooms(user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("classrooms").select("*").order("room_number").execute()
    return res.data


@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(body: ClassroomCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    data = body.model_dump(exclude_none=True)
    res = supabase.table("classrooms").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create classroom")
    return res.data[0]


@router.put("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(classroom_id: str, body: ClassroomUpdate, user=Depends(require_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = supabase.table("classrooms").update(update_data).eq("id", classroom_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return res.data[0]


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(classroom_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("classrooms").delete().eq("id", classroom_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Classroom not found")
