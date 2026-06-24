from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from schemas.assignments import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from auth.guards import require_teacher_or_admin, require_authenticated
from config import get_supabase

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _get_teacher_id(uid: str):
    supabase = get_supabase()
    res = supabase.table("teachers").select("id").eq("user_id", uid).maybe_single().execute()
    return res.data["id"] if res.data else None


@router.get("", response_model=List[AssignmentResponse])
def list_assignments(class_id: Optional[str] = None, user=Depends(require_authenticated)):
    supabase = get_supabase()
    query = supabase.table("assignments").select("*").order("due_date")
    if class_id:
        query = query.eq("class_id", class_id)
    res = query.execute()
    return res.data


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(body: AssignmentCreate, user=Depends(require_teacher_or_admin)):
    supabase = get_supabase()
    teacher_id = _get_teacher_id(user.id)
    if not teacher_id:
        raise HTTPException(status_code=403, detail="No teacher profile found for this user")
    data = body.model_dump(exclude_none=True)
    data["class_id"] = str(data["class_id"])
    data["teacher_id"] = teacher_id
    if "due_date" in data and data["due_date"] is not None:
        data["due_date"] = data["due_date"].isoformat()
    res = supabase.table("assignments").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create assignment")
    return res.data[0]


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: str, body: AssignmentUpdate, user=Depends(require_teacher_or_admin)
):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "due_date" in update_data and update_data["due_date"] is not None:
        update_data["due_date"] = update_data["due_date"].isoformat()
    res = supabase.table("assignments").update(update_data).eq("id", assignment_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return res.data[0]


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: str, user=Depends(require_teacher_or_admin)):
    supabase = get_supabase()
    res = supabase.table("assignments").delete().eq("id", assignment_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
