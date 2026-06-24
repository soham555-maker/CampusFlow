"""
Seed script: populates CampusFlow DB with enough sample data to run tests.
Uses the Supabase service role key (bypasses RLS).

Usage (from the backend/ directory, with venv active):
    python -m tests.seed_data

Returns a dict of created IDs that test_api.py can consume.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import get_supabase

# ---------------------------------------------------------------------------

def seed() -> dict:
    sb = get_supabase()
    ids = {}

    # 1. Subject
    res = sb.table("subjects").insert({
        "subject_name": "Data Structures",
        "subject_code": "CS201",
        "credits": 4,
        "description": "Fundamental data structures and algorithms",
    }).execute()
    ids["subject_id"] = res.data[0]["id"]
    print(f"  Subject:   {ids['subject_id']}")

    # 2. Teacher (no auth user — pre-provisioned roster entry)
    res = sb.table("teachers").insert({
        "full_name": "Dr. Alice Smith",
        "email": "alice@campusflow.test",
        "department": "Computer Science",
        "designation": "Associate Professor",
    }).execute()
    ids["teacher_id"] = res.data[0]["id"]
    print(f"  Teacher:   {ids['teacher_id']}")

    # 3. Term
    res = sb.table("terms").insert({
        "name": "Fall 2025",
        "start_date": "2025-08-01",
        "end_date": "2025-12-15",
        "is_active": True,
    }).execute()
    ids["term_id"] = res.data[0]["id"]
    ids["term_join_code"] = res.data[0].get("join_code")
    print(f"  Term:      {ids['term_id']}  (join_code={ids['term_join_code']})")

    # 4. Classroom
    res = sb.table("classrooms").insert({
        "room_number": "LH-101",
        "building": "Main Block",
        "floor": 1,
        "capacity": 60,
        "room_type": "lecture",
    }).execute()
    ids["classroom_id"] = res.data[0]["id"]
    print(f"  Classroom: {ids['classroom_id']}")

    # 5. Classroom 2 (for conflict test)
    res = sb.table("classrooms").insert({
        "room_number": "LAB-201",
        "building": "Tech Block",
        "floor": 2,
        "capacity": 30,
        "room_type": "lab",
    }).execute()
    ids["classroom2_id"] = res.data[0]["id"]
    print(f"  Classroom2:{ids['classroom2_id']}")

    # 6. Class
    res = sb.table("classes").insert({
        "subject_id": ids["subject_id"],
        "teacher_id": ids["teacher_id"],
        "term_id": ids["term_id"],
        "semester": 3,
        "division": "A",
    }).execute()
    ids["class_id"] = res.data[0]["id"]
    ids["class_join_code"] = res.data[0].get("join_code")
    print(f"  Class:     {ids['class_id']}  (join_code={ids['class_join_code']})")

    # 7. Student (pre-provisioned — no auth user)
    res = sb.table("students").insert({
        "full_name": "Bob Jones",
        "email": "bob@campusflow.test",
        "roll_number": "2025001",
        "semester": 3,
        "division": "A",
        "year": 2,
    }).execute()
    ids["student_id"] = res.data[0]["id"]
    print(f"  Student:   {ids['student_id']}")

    # 8. Enroll student in class
    res = sb.table("student_classes").insert({
        "student_id": ids["student_id"],
        "class_id": ids["class_id"],
    }).execute()
    ids["enrollment_id"] = res.data[0]["id"]
    print(f"  Enrollment:{ids['enrollment_id']}")

    # 9. Timetable slot
    res = sb.table("timetable_slots").insert({
        "class_id": ids["class_id"],
        "classroom_id": ids["classroom_id"],
        "day": "Monday",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
    }).execute()
    ids["slot_id"] = res.data[0]["id"]
    print(f"  Slot:      {ids['slot_id']}")

    # 10. Announcement
    res = sb.table("announcements").insert({
        "class_id": ids["class_id"],
        "teacher_id": ids["teacher_id"],
        "title": "Welcome to DS!",
        "body": "Looking forward to a great semester.",
    }).execute()
    ids["announcement_id"] = res.data[0]["id"]
    print(f"  Announce:  {ids['announcement_id']}")

    # 11. Assignment
    res = sb.table("assignments").insert({
        "class_id": ids["class_id"],
        "teacher_id": ids["teacher_id"],
        "title": "Assignment 1: Linked Lists",
        "description": "Implement a doubly linked list.",
        "due_date": "2025-09-15T23:59:00",
        "max_marks": 100,
    }).execute()
    ids["assignment_id"] = res.data[0]["id"]
    print(f"  Assignment:{ids['assignment_id']}")

    # 12. Mark
    res = sb.table("marks").insert({
        "assignment_id": ids["assignment_id"],
        "student_id": ids["student_id"],
        "marks_obtained": 88,
        "feedback": "Great work!",
    }).execute()
    ids["mark_id"] = res.data[0]["id"]
    print(f"  Mark:      {ids['mark_id']}")

    return ids


def teardown(ids: dict):
    """Remove all seeded rows (in FK-safe reverse order)."""
    sb = get_supabase()
    steps = [
        ("marks",           "id",          [ids.get("mark_id")]),
        ("assignments",     "id",          [ids.get("assignment_id")]),
        ("announcements",   "id",          [ids.get("announcement_id")]),
        ("timetable_slots", "id",          [ids.get("slot_id")]),
        ("student_classes", "id",          [ids.get("enrollment_id")]),
        ("classes",         "id",          [ids.get("class_id")]),
        ("students",        "id",          [ids.get("student_id")]),
        ("classrooms",      "id",          [ids.get("classroom_id"), ids.get("classroom2_id")]),
        ("terms",           "id",          [ids.get("term_id")]),
        ("teachers",        "id",          [ids.get("teacher_id")]),
        ("subjects",        "id",          [ids.get("subject_id")]),
    ]
    for table, col, row_ids in steps:
        for rid in row_ids:
            if rid:
                sb.table(table).delete().eq(col, rid).execute()
    print("  Teardown complete.")


if __name__ == "__main__":
    print("Seeding database...")
    ids = seed()
    print("\nSeeded IDs:")
    for k, v in ids.items():
        print(f"  {k}: {v}")
