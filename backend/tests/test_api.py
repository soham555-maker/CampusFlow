"""
CampusFlow API integration test suite.
Uses httpx to call a locally running FastAPI server.

Prerequisites:
  1. uvicorn main:app --reload  (running on localhost:8000)
  2. Valid SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env

Run from the backend/ directory:
    python -m tests.test_api

The tests use the service-role Supabase client directly for setup/teardown
(no auth token needed for admin-level ops in tests — we call the API endpoints
that require auth with a NOTE about what would be needed in a real environment).
"""

import sys
import os
import json
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import httpx
from tests.seed_data import seed, teardown

BASE = "http://localhost:8000"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_pass = 0
_fail = 0
_skip = 0


def ok(label: str):
    global _pass
    _pass += 1
    print(f"  PASS  {label}")


def fail(label: str, reason: str = ""):
    global _fail
    _fail += 1
    print(f"  FAIL  {label}" + (f" — {reason}" if reason else ""))


def skip(label: str, reason: str = ""):
    global _skip
    _skip += 1
    print(f"  SKIP  {label}" + (f" — {reason}" if reason else ""))


def assert_status(res: httpx.Response, expected: int, label: str):
    if res.status_code == expected:
        ok(label)
    else:
        try:
            body = res.json()
        except Exception:
            body = res.text
        fail(label, f"got {res.status_code}, body={json.dumps(body)[:200]}")


# ---------------------------------------------------------------------------
# Test sections
# ---------------------------------------------------------------------------

def test_health(client: httpx.Client):
    print("\n── Health ──")
    r = client.get("/")
    assert_status(r, 200, "GET / health check")
    if r.status_code == 200 and r.json().get("status") == "ok":
        ok("health check returns status=ok")
    else:
        fail("health check returns status=ok", str(r.json()))


def test_read_endpoints(client: httpx.Client, ids: dict):
    """
    These endpoints require a valid Bearer token.  Without a real user token
    we expect 401 — which proves the auth guard is working.
    """
    print("\n── Auth guard (unauthenticated → 401) ──")
    guarded = [
        ("GET", "/students"),
        ("GET", "/teachers"),
        ("GET", "/subjects"),
        ("GET", "/terms"),
        ("GET", "/classrooms"),
        ("GET", "/classes"),
        ("GET", "/timetable"),
        ("GET", "/announcements"),
        ("GET", "/assignments"),
    ]
    for method, path in guarded:
        r = client.request(method, path)
        if r.status_code in (401, 403):
            ok(f"{method} {path} → 401/403 without token")
        else:
            fail(f"{method} {path} → 401/403 without token", f"got {r.status_code}")


def test_timetable_direct(client: httpx.Client, ids: dict):
    """
    These tests call the DB directly through the service-role client (bypassing
    FastAPI auth).  They verify the business logic layer.
    """
    from config import get_supabase
    from utils.conflict import check_timetable_conflict

    sb = get_supabase()
    print("\n── Conflict detection (service-role / direct) ──")

    # Slot that definitely overlaps the seeded Monday 09:00–10:00 slot
    conflict_slot = {
        "classroom_id": ids["classroom_id"],
        "teacher_id":   ids["teacher_id"],
        "term_id":      ids["term_id"],
        "day":          "Monday",
        "start_time":   "09:30:00",
        "end_time":     "10:30:00",
    }
    result = check_timetable_conflict(sb, conflict_slot)
    if result["has_conflict"]:
        ok("classroom double-booking detected")
    else:
        fail("classroom double-booking detected", "no conflict returned")

    # Teacher conflict (different classroom, same teacher same time)
    teacher_conflict_slot = {
        "classroom_id": ids["classroom2_id"],
        "teacher_id":   ids["teacher_id"],
        "term_id":      ids["term_id"],
        "day":          "Monday",
        "start_time":   "09:00:00",
        "end_time":     "10:00:00",
    }
    result2 = check_timetable_conflict(sb, teacher_conflict_slot)
    if result2["has_conflict"]:
        ok("teacher double-booking detected")
    else:
        fail("teacher double-booking detected", "no conflict returned")

    # Non-overlapping slot (should be free)
    free_slot = {
        "classroom_id": ids["classroom_id"],
        "teacher_id":   ids["teacher_id"],
        "term_id":      ids["term_id"],
        "day":          "Monday",
        "start_time":   "11:00:00",
        "end_time":     "12:00:00",
    }
    result3 = check_timetable_conflict(sb, free_slot)
    if not result3["has_conflict"]:
        ok("non-overlapping slot has no conflict")
    else:
        fail("non-overlapping slot has no conflict", result3["reason"])

    # Self-exclusion: updating the existing slot should not flag itself
    result4 = check_timetable_conflict(sb, conflict_slot, exclude_slot_id=ids["slot_id"])
    # Because we excluded the slot, classroom is free now — but teacher still has
    # the same slot (same slot_id excluded). So overlap should still be gone.
    # Actually after exclusion the classroom row IS excluded → no conflict.
    if not result4["has_conflict"]:
        ok("self-exclusion works for update")
    else:
        fail("self-exclusion works for update", result4["reason"])


def test_free_room_finder(client: httpx.Client, ids: dict):
    print("\n── Free Room Finder (unauthenticated → 401) ──")
    r = client.get(
        "/timetable/classrooms/available",
        params={
            "day": "Monday",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "term_id": ids["term_id"],
        },
    )
    # No token → 401/403
    if r.status_code in (401, 403):
        ok("GET /timetable/classrooms/available requires auth")
    else:
        fail("GET /timetable/classrooms/available requires auth", f"got {r.status_code}")


def test_teacher_availability(client: httpx.Client, ids: dict):
    print("\n── Teacher Availability (unauthenticated → 401) ──")
    r = client.get(
        "/timetable/teacher-availability",
        params={"teacher_id": ids["teacher_id"], "term_id": ids["term_id"]},
    )
    if r.status_code in (401, 403):
        ok("GET /timetable/teacher-availability requires auth")
    else:
        fail("GET /timetable/teacher-availability requires auth", f"got {r.status_code}")


def test_service_role_crud(ids: dict):
    """
    Direct Supabase service-role CRUD tests (bypasses FastAPI layer).
    Verifies that seeded data is readable and that FK constraints hold.
    """
    from config import get_supabase

    sb = get_supabase()
    print("\n── Service-role DB CRUD ──")

    # Students
    r = sb.table("students").select("*").eq("id", ids["student_id"]).execute()
    if r.data and r.data[0]["full_name"] == "Bob Jones":
        ok("student row readable")
    else:
        fail("student row readable")

    # Teachers
    r = sb.table("teachers").select("*").eq("id", ids["teacher_id"]).execute()
    if r.data and r.data[0]["email"] == "alice@campusflow.test":
        ok("teacher row readable")
    else:
        fail("teacher row readable")

    # Subjects
    r = sb.table("subjects").select("*").eq("id", ids["subject_id"]).execute()
    if r.data and r.data[0]["subject_code"] == "CS201":
        ok("subject row readable")
    else:
        fail("subject row readable")

    # Terms
    r = sb.table("terms").select("*").eq("id", ids["term_id"]).execute()
    if r.data and r.data[0]["name"] == "Fall 2025":
        ok("term row readable")
    else:
        fail("term row readable")
    if r.data and r.data[0].get("join_code"):
        ok("term has join_code")
    else:
        skip("term has join_code", "join_code column may not exist yet — run migration 001")

    # Classes with join_code
    r = sb.table("classes").select("*").eq("id", ids["class_id"]).execute()
    if r.data and r.data[0].get("join_code"):
        ok("class has join_code")
    else:
        skip("class has join_code", "join_code column may not exist yet — run migration 001")

    # Classrooms
    r = sb.table("classrooms").select("*").eq("id", ids["classroom_id"]).execute()
    if r.data and r.data[0]["room_number"] == "LH-101":
        ok("classroom row readable")
    else:
        fail("classroom row readable")

    # Timetable slot — verify sync_slot_from_class trigger populated teacher_id / term_id
    r = sb.table("timetable_slots").select("*").eq("id", ids["slot_id"]).execute()
    if not r.data:
        fail("timetable_slot row readable")
    else:
        slot = r.data[0]
        ok("timetable_slot row readable")
        if slot.get("teacher_id") == ids["teacher_id"]:
            ok("sync_slot_from_class trigger set teacher_id correctly")
        else:
            fail("sync_slot_from_class trigger set teacher_id correctly", f"got {slot.get('teacher_id')}")
        if slot.get("term_id") == ids["term_id"]:
            ok("sync_slot_from_class trigger set term_id correctly")
        else:
            fail("sync_slot_from_class trigger set term_id correctly", f"got {slot.get('term_id')}")

    # Announcements
    r = sb.table("announcements").select("*").eq("id", ids["announcement_id"]).execute()
    if r.data and r.data[0]["title"] == "Welcome to DS!":
        ok("announcement row readable")
    else:
        fail("announcement row readable")

    # Assignments
    r = sb.table("assignments").select("*").eq("id", ids["assignment_id"]).execute()
    if r.data and r.data[0]["max_marks"] == 100:
        ok("assignment row readable")
    else:
        fail("assignment row readable")

    # Marks
    r = sb.table("marks").select("*").eq("id", ids["mark_id"]).execute()
    if r.data and float(r.data[0]["marks_obtained"]) == 88:
        ok("mark row readable with correct value")
    else:
        fail("mark row readable with correct value")

    # Enrollment
    r = sb.table("student_classes").select("*").eq("id", ids["enrollment_id"]).execute()
    if r.data:
        ok("student_classes enrollment readable")
    else:
        fail("student_classes enrollment readable")

    # Duplicate enrollment should fail (unique constraint)
    try:
        sb.table("student_classes").insert({
            "student_id": ids["student_id"],
            "class_id": ids["class_id"],
        }).execute()
        fail("duplicate enrollment prevented by unique constraint")
    except Exception:
        ok("duplicate enrollment prevented by unique constraint")

    # DB-level classroom double-booking (EXCLUDE constraint)
    try:
        sb.table("timetable_slots").insert({
            "class_id": ids["class_id"],
            "classroom_id": ids["classroom_id"],
            "day": "Monday",
            "start_time": "09:30:00",
            "end_time": "10:30:00",
        }).execute()
        fail("DB EXCLUDE constraint blocks classroom double-booking")
    except Exception:
        ok("DB EXCLUDE constraint blocks classroom double-booking")


def test_swagger_docs(client: httpx.Client):
    print("\n── Swagger docs ──")
    r = client.get("/docs")
    assert_status(r, 200, "GET /docs returns 200")
    r = client.get("/openapi.json")
    assert_status(r, 200, "GET /openapi.json returns 200")
    if r.status_code == 200:
        paths = r.json().get("paths", {})
        expected_prefixes = [
            "/students", "/teachers", "/subjects", "/terms",
            "/classrooms", "/classes", "/announcements",
            "/assignments", "/marks", "/timetable",
        ]
        for prefix in expected_prefixes:
            found = any(p.startswith(prefix) for p in paths)
            if found:
                ok(f"OpenAPI schema contains {prefix} routes")
            else:
                fail(f"OpenAPI schema contains {prefix} routes")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("CampusFlow API Test Suite")
    print("=" * 60)

    # Seed
    print("\nSeeding test data...")
    try:
        ids = seed()
    except Exception as e:
        print(f"\nSEED FAILED: {e}")
        traceback.print_exc()
        sys.exit(1)

    try:
        with httpx.Client(base_url=BASE, timeout=10.0) as client:
            test_health(client)
            test_swagger_docs(client)
            test_read_endpoints(client, ids)
            test_free_room_finder(client, ids)
            test_teacher_availability(client, ids)
            test_timetable_direct(client, ids)
            test_service_role_crud(ids)

    except httpx.ConnectError:
        print(
            "\n⚠  Could not connect to http://localhost:8000\n"
            "   Start the server first:  uvicorn main:app --reload\n"
            "   Skipping HTTP tests — running DB-only tests...\n"
        )
        test_timetable_direct(None, ids)
        test_service_role_crud(ids)

    finally:
        print("\nTearing down test data...")
        teardown(ids)

    print("\n" + "=" * 60)
    print(f"  PASSED: {_pass}  FAILED: {_fail}  SKIPPED: {_skip}")
    print("=" * 60)
    sys.exit(1 if _fail > 0 else 0)


if __name__ == "__main__":
    main()
