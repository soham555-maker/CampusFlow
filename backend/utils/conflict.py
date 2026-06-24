from datetime import time


def _times_overlap(s1: time, e1: time, s2: time, e2: time) -> bool:
    return max(s1, s2) < min(e1, e2)


def check_timetable_conflict(
    supabase,
    slot: dict,
    exclude_slot_id: str = None,
) -> dict:
    """
    Layer-1 API conflict check. Returns {"has_conflict": bool, "reason": str}.
    Pass exclude_slot_id when updating an existing slot so it isn't flagged
    against itself.
    """
    start_time = slot["start_time"]
    end_time = slot["end_time"]
    # Normalise to time objects
    if isinstance(start_time, str):
        start_time = time.fromisoformat(start_time)
    if isinstance(end_time, str):
        end_time = time.fromisoformat(end_time)

    # ── Classroom conflict ────────────────────────────────────────────────────
    classroom_query = (
        supabase.table("timetable_slots")
        .select("id, start_time, end_time, classroom_id")
        .eq("classroom_id", str(slot["classroom_id"]))
        .eq("term_id", str(slot["term_id"]))
        .eq("day", slot["day"])
    )
    if exclude_slot_id:
        classroom_query = classroom_query.neq("id", exclude_slot_id)
    existing_classroom = classroom_query.execute()

    # Fetch classroom label for the error message
    room_label = str(slot["classroom_id"])
    cr_res = (
        supabase.table("classrooms")
        .select("room_number")
        .eq("id", str(slot["classroom_id"]))
        .maybe_single()
        .execute()
    )
    if cr_res.data:
        room_label = cr_res.data["room_number"]

    for row in existing_classroom.data:
        r_start = time.fromisoformat(row["start_time"])
        r_end = time.fromisoformat(row["end_time"])
        if _times_overlap(start_time, end_time, r_start, r_end):
            return {
                "has_conflict": True,
                "reason": (
                    f"Classroom {room_label} is already booked on {slot['day']} "
                    f"from {r_start.strftime('%H:%M')} to {r_end.strftime('%H:%M')}"
                ),
            }

    # ── Teacher conflict ──────────────────────────────────────────────────────
    teacher_query = (
        supabase.table("timetable_slots")
        .select("id, start_time, end_time, teacher_id")
        .eq("teacher_id", str(slot["teacher_id"]))
        .eq("term_id", str(slot["term_id"]))
        .eq("day", slot["day"])
    )
    if exclude_slot_id:
        teacher_query = teacher_query.neq("id", exclude_slot_id)
    existing_teacher = teacher_query.execute()

    teacher_label = str(slot["teacher_id"])
    tr_res = (
        supabase.table("teachers")
        .select("full_name")
        .eq("id", str(slot["teacher_id"]))
        .maybe_single()
        .execute()
    )
    if tr_res.data:
        teacher_label = tr_res.data["full_name"]

    for row in existing_teacher.data:
        r_start = time.fromisoformat(row["start_time"])
        r_end = time.fromisoformat(row["end_time"])
        if _times_overlap(start_time, end_time, r_start, r_end):
            return {
                "has_conflict": True,
                "reason": (
                    f"Teacher {teacher_label} is already scheduled on {slot['day']} "
                    f"from {r_start.strftime('%H:%M')} to {r_end.strftime('%H:%M')}"
                ),
            }

    return {"has_conflict": False, "reason": ""}
