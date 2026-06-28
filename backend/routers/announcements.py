from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from schemas.announcements import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from auth.dependencies import get_current_user, get_user_role
from auth.guards import require_teacher_or_admin, require_authenticated
from config import get_supabase
from utils.db import fetch_one

router = APIRouter(prefix="/announcements", tags=["announcements"])


def _get_teacher_id(uid: str):
    supabase = get_supabase()
    row = fetch_one(supabase.table("teachers").select("id").eq("user_id", uid))
    return row["id"] if row else None


@router.get("", response_model=List[AnnouncementResponse])
def list_announcements(class_id: Optional[str] = None, user=Depends(require_authenticated)):
    supabase = get_supabase()
    query = supabase.table("announcements").select("*").order("created_at", desc=True)
    if class_id:
        query = query.eq("class_id", class_id)
    res = query.execute()
    return res.data


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(body: AnnouncementCreate, user=Depends(require_teacher_or_admin)):
    supabase = get_supabase()
    teacher_id = _get_teacher_id(user.id)
    if not teacher_id:
        raise HTTPException(status_code=403, detail="No teacher profile found for this user")
    data = body.model_dump()
    data["class_id"] = str(data["class_id"])
    data["teacher_id"] = teacher_id
    res = supabase.table("announcements").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create announcement")
    return res.data[0]


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: str, body: AnnouncementUpdate, user=Depends(require_teacher_or_admin)
):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = supabase.table("announcements").update(update_data).eq("id", announcement_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return res.data[0]


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(announcement_id: str, user=Depends(require_teacher_or_admin)):
    supabase = get_supabase()
    res = supabase.table("announcements").delete().eq("id", announcement_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Announcement not found")
