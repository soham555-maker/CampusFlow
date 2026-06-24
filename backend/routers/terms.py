from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from schemas.terms import TermCreate, TermUpdate, TermResponse
from auth.guards import require_admin
from config import get_supabase

router = APIRouter(prefix="/terms", tags=["terms"])


@router.get("", response_model=List[TermResponse])
def list_terms(active_only: Optional[bool] = None, user=Depends(require_admin)):
    supabase = get_supabase()
    query = supabase.table("terms").select("*").order("name")
    if active_only:
        query = query.eq("is_active", True)
    res = query.execute()
    return res.data


@router.post("", response_model=TermResponse, status_code=status.HTTP_201_CREATED)
def create_term(body: TermCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    data = body.model_dump(exclude_none=True)
    # Convert date objects to ISO strings for Supabase
    for k in ("start_date", "end_date"):
        if k in data and data[k] is not None:
            data[k] = data[k].isoformat()
    res = supabase.table("terms").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create term")
    return res.data[0]


@router.put("/{term_id}", response_model=TermResponse)
def update_term(term_id: str, body: TermUpdate, user=Depends(require_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    for k in ("start_date", "end_date"):
        if k in update_data and update_data[k] is not None:
            update_data[k] = update_data[k].isoformat()
    res = supabase.table("terms").update(update_data).eq("id", term_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Term not found")
    return res.data[0]


@router.delete("/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_term(term_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("terms").delete().eq("id", term_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Term not found")
