from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import time

from schemas.timetable_slots import (
    TimetableSlotCreate,
    TimetableSlotUpdate,
    TimetableSlotResponse,
)
from auth.dependencies import get_current_user, get_user_role
from auth.guards import require_authenticated, require_teacher_or_admin
from schemas.classrooms import ClassroomResponse
from utils.conflict import check_timetable_conflict
from utils.db import fetch_one
from config import get_supabase

router = APIRouter(prefix="/timetable", tags=["timetable"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_teacher_row(uid: str):
    supabase = get_supabase()
    return fetch_one(supabase.table("teachers").select("id").eq("user_id", uid))


def _get_student_row(uid: str):
    supabase = get_supabase()
    return fetch_one(supabase.table("students").select("id").eq("user_id", uid))


def _resolve_teacher_id_for_slot(class_id: str) -> Optional[str]:
    """Fetch the teacher_id from the parent class (needed for conflict checks before insert)."""
    supabase = get_supabase()
    return fetch_one(
        supabase.table("classes").select("teacher_id, term_id").eq("id", class_id)
    )


def _handle_db_conflict_error(exc: Exception) -> HTTPException:
    msg = str(exc).lower()
    if "no_classroom_overlap" in msg:
        return HTTPException(status_code=409, detail="Classroom double-booking detected (DB constraint)")
    if "no_teacher_overlap" in msg:
        return HTTPException(status_code=409, detail="Teacher double-booking detected (DB constraint)")
    raise exc


# ── Read endpoints (any authenticated user) ───────────────────────────────────

@router.get("", response_model=List[TimetableSlotResponse])
def list_slots(term_id: Optional[str] = None, user=Depends(require_authenticated)):
    supabase = get_supabase()
    query = supabase.table("timetable_slots").select("*").order("day").order("start_time")
    if term_id:
        query = query.eq("term_id", term_id)
    res = query.execute()
    return res.data


@router.get("/my", response_model=List[TimetableSlotResponse])
def get_my_slots(user=Depends(require_authenticated), role: str = Depends(get_user_role)):
    supabase = get_supabase()
    if role == "student":
        student = _get_student_row(user.id)
        if not student:
            return []
        enrollments = (
            supabase.table("student_classes")
            .select("class_id")
            .eq("student_id", student["id"])
            .execute()
        )
        class_ids = [e["class_id"] for e in enrollments.data]
        if not class_ids:
            return []
        res = (
            supabase.table("timetable_slots")
            .select("*")
            .in_("class_id", class_ids)
            .order("day")
            .order("start_time")
            .execute()
        )
        return res.data

    elif role == "teacher":
        teacher = _get_teacher_row(user.id)
        if not teacher:
            return []
        res = (
            supabase.table("timetable_slots")
            .select("*")
            .eq("teacher_id", teacher["id"])
            .order("day")
            .order("start_time")
            .execute()
        )
        return res.data

    # Admin gets all
    res = supabase.table("timetable_slots").select("*").order("day").order("start_time").execute()
    return res.data


@router.get("/teacher/{teacher_id}", response_model=List[TimetableSlotResponse])
def get_slots_by_teacher(teacher_id: str, user=Depends(require_authenticated)):
    supabase = get_supabase()
    res = (
        supabase.table("timetable_slots")
        .select("*")
        .eq("teacher_id", teacher_id)
        .order("day")
        .order("start_time")
        .execute()
    )
    return res.data


@router.get("/student/{student_id}", response_model=List[TimetableSlotResponse])
def get_slots_by_student(student_id: str, user=Depends(require_authenticated)):
    supabase = get_supabase()
    enrollments = (
        supabase.table("student_classes")
        .select("class_id")
        .eq("student_id", student_id)
        .execute()
    )
    class_ids = [e["class_id"] for e in enrollments.data]
    if not class_ids:
        return []
    res = (
        supabase.table("timetable_slots")
        .select("*")
        .in_("class_id", class_ids)
        .order("day")
        .order("start_time")
        .execute()
    )
    return res.data


# ── Classroom availability (Free Room Finder) ─────────────────────────────────

@router.get("/classrooms/available", response_model=List[ClassroomResponse])
def find_available_classrooms(
    day: str,
    start_time: str,
    end_time: str,
    term_id: str,
    user=Depends(require_authenticated),
):
    supabase = get_supabase()
    t_start = time.fromisoformat(start_time)
    t_end = time.fromisoformat(end_time)

    # Get all slots on this day/term
    slots_res = (
        supabase.table("timetable_slots")
        .select("classroom_id, start_time, end_time")
        .eq("day", day)
        .eq("term_id", term_id)
        .execute()
    )

    occupied_ids = set()
    for s in slots_res.data:
        s_start = time.fromisoformat(s["start_time"])
        s_end = time.fromisoformat(s["end_time"])
        if max(t_start, s_start) < min(t_end, s_end):
            occupied_ids.add(s["classroom_id"])

    all_classrooms = supabase.table("classrooms").select("*").order("room_number").execute()
    available = [c for c in all_classrooms.data if c["id"] not in occupied_ids]
    return available


# ── Teacher availability ──────────────────────────────────────────────────────

@router.get("/teacher-availability")
def get_teacher_availability(
    teacher_id: str,
    term_id: str,
    user=Depends(require_authenticated),
):
    supabase = get_supabase()
    slots_res = (
        supabase.table("timetable_slots")
        .select("day, start_time, end_time")
        .eq("teacher_id", teacher_id)
        .eq("term_id", term_id)
        .order("day")
        .order("start_time")
        .execute()
    )

    DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    busy_by_day: dict = {d: [] for d in DAYS}
    for s in slots_res.data:
        busy_by_day[s["day"]].append(
            {"start": s["start_time"], "end": s["end_time"]}
        )

    # Compute free windows within 08:00–18:00
    WORK_START = time(8, 0)
    WORK_END = time(18, 0)

    result = {}
    for day, busy_slots in busy_by_day.items():
        sorted_slots = sorted(busy_slots, key=lambda x: x["start"])
        free_windows = []
        cursor = WORK_START
        for bs in sorted_slots:
            bs_start = time.fromisoformat(bs["start"])
            bs_end = time.fromisoformat(bs["end"])
            if cursor < bs_start:
                free_windows.append(
                    {"start": cursor.strftime("%H:%M"), "end": bs_start.strftime("%H:%M")}
                )
            cursor = max(cursor, bs_end)
        if cursor < WORK_END:
            free_windows.append(
                {"start": cursor.strftime("%H:%M"), "end": WORK_END.strftime("%H:%M")}
            )
        result[day] = {
            "busy": busy_slots,
            "free": free_windows,
        }

    return result


# ── Legacy conflict check endpoint (kept for compatibility) ───────────────────

@router.post("/check-conflicts")
def check_conflicts_legacy(slot: TimetableSlotCreate):
    """Legacy endpoint — use POST /timetable for conflict-aware slot creation."""
    supabase = get_supabase()
    class_info = _resolve_teacher_id_for_slot(str(slot.class_id))
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    slot_dict = slot.model_dump()
    slot_dict["teacher_id"] = class_info["teacher_id"]
    slot_dict["term_id"] = class_info["term_id"]
    return check_timetable_conflict(supabase, slot_dict)


# ── Admin / Teacher CRUD (with conflict detection) ────────────────────────────

@router.post("", response_model=TimetableSlotResponse, status_code=status.HTTP_201_CREATED)
def create_slot(slot: TimetableSlotCreate, user=Depends(require_teacher_or_admin), role: str = Depends(get_user_role)):
    supabase = get_supabase()

    # Resolve teacher_id and term_id from the class (the DB trigger also does this,
    # but we need them NOW for the conflict pre-check)
    class_info = _resolve_teacher_id_for_slot(str(slot.class_id))
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")

    teacher_id = class_info["teacher_id"]
    term_id = class_info["term_id"]

    # Teachers can only create slots for their own classes
    if role == "teacher":
        teacher_row = _get_teacher_row(user.id)
        if not teacher_row or teacher_row["id"] != teacher_id:
            raise HTTPException(
                status_code=403, detail="You can only create slots for your own classes"
            )

    slot_dict = {
        "classroom_id": str(slot.classroom_id),
        "teacher_id": teacher_id,
        "term_id": term_id,
        "day": slot.day,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
    }

    # Layer 1: API-level conflict check
    conflict = check_timetable_conflict(supabase, slot_dict)
    if conflict["has_conflict"]:
        raise HTTPException(status_code=409, detail=conflict["reason"])

    data = {
        "class_id": str(slot.class_id),
        "classroom_id": str(slot.classroom_id),
        "day": slot.day,
        "start_time": slot.start_time.isoformat(),
        "end_time": slot.end_time.isoformat(),
    }

    try:
        res = supabase.table("timetable_slots").insert(data).execute()
    except Exception as exc:
        raise _handle_db_conflict_error(exc)

    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create slot")
    return res.data[0]


@router.put("/{slot_id}", response_model=TimetableSlotResponse)
def update_slot(
    slot_id: str,
    slot: TimetableSlotUpdate,
    user=Depends(require_teacher_or_admin),
    role: str = Depends(get_user_role),
):
    supabase = get_supabase()

    # Fetch existing slot
    existing = fetch_one(
        supabase.table("timetable_slots").select("*").eq("id", slot_id)
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Teachers can only modify their own slots
    if role == "teacher":
        teacher_row = _get_teacher_row(user.id)
        if not teacher_row or teacher_row["id"] != existing["teacher_id"]:
            raise HTTPException(
                status_code=403, detail="You can only modify your own slots"
            )

    update_data = slot.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Build the merged slot dict for conflict check
    merged = {
        "classroom_id": str(update_data.get("classroom_id", existing["classroom_id"])),
        "teacher_id": existing["teacher_id"],
        "term_id": existing["term_id"],
        "day": update_data.get("day", existing["day"]),
        "start_time": update_data.get("start_time", time.fromisoformat(existing["start_time"])),
        "end_time": update_data.get("end_time", time.fromisoformat(existing["end_time"])),
    }

    conflict = check_timetable_conflict(supabase, merged, exclude_slot_id=slot_id)
    if conflict["has_conflict"]:
        raise HTTPException(status_code=409, detail=conflict["reason"])

    # Serialise time objects
    if "classroom_id" in update_data:
        update_data["classroom_id"] = str(update_data["classroom_id"])
    if "start_time" in update_data:
        update_data["start_time"] = update_data["start_time"].isoformat()
    if "end_time" in update_data:
        update_data["end_time"] = update_data["end_time"].isoformat()

    try:
        res = supabase.table("timetable_slots").update(update_data).eq("id", slot_id).execute()
    except Exception as exc:
        raise _handle_db_conflict_error(exc)

    if not res.data:
        raise HTTPException(status_code=404, detail="Slot not found")
    return res.data[0]


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(
    slot_id: str,
    user=Depends(require_teacher_or_admin),
    role: str = Depends(get_user_role),
):
    supabase = get_supabase()

    if role == "teacher":
        teacher_row = _get_teacher_row(user.id)
        existing = fetch_one(
            supabase.table("timetable_slots").select("teacher_id").eq("id", slot_id)
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Slot not found")
        if not teacher_row or teacher_row["id"] != existing["teacher_id"]:
            raise HTTPException(status_code=403, detail="You can only delete your own slots")

    res = supabase.table("timetable_slots").delete().eq("id", slot_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Slot not found")
