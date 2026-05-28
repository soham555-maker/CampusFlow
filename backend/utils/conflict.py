from datetime import time

def check_timetable_conflict(supabase, slot: dict) -> dict:
    """
    Checks if there's a conflict for the given slot.
    Returns: {"has_conflict": bool, "reason": str}
    """
    # Check classroom conflict
    res_classroom = supabase.table("timetable_slots").select("start_time, end_time").eq("classroom_id", str(slot["classroom_id"])).eq("term_id", str(slot["term_id"])).eq("day", slot["day"]).execute()
    
    start_time = slot["start_time"]
    end_time = slot["end_time"]
    
    for row in res_classroom.data:
        r_start = time.fromisoformat(row["start_time"])
        r_end = time.fromisoformat(row["end_time"])
        if max(start_time, r_start) < min(end_time, r_end):
            return {"has_conflict": True, "reason": "Classroom is already booked at this time."}

    # Check teacher conflict
    res_teacher = supabase.table("timetable_slots").select("start_time, end_time").eq("teacher_id", str(slot["teacher_id"])).eq("term_id", str(slot["term_id"])).eq("day", slot["day"]).execute()
    
    for row in res_teacher.data:
        r_start = time.fromisoformat(row["start_time"])
        r_end = time.fromisoformat(row["end_time"])
        if max(start_time, r_start) < min(end_time, r_end):
            return {"has_conflict": True, "reason": "Teacher is already scheduled at this time."}

    return {"has_conflict": False, "reason": ""}
