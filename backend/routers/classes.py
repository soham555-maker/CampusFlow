from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from schemas.classes import ClassCreate, ClassUpdate, ClassResponse
from schemas.student_classes import StudentClassJoin, StudentClassResponse, StudentClassCreate
from schemas.students import StudentResponse
from auth.dependencies import get_current_user, get_user_role
from auth.guards import require_admin, require_authenticated
from config import get_supabase
from utils.db import fetch_one

router = APIRouter(prefix="/classes", tags=["classes"])


def _flatten_class(row: dict) -> dict:
    """Flatten PostgREST join results into ClassResponse-compatible dict."""
    result = dict(row)
    if "subjects" in result and result["subjects"]:
        result["subject_name"] = result["subjects"].get("subject_name")
    else:
        result["subject_name"] = None
    result.pop("subjects", None)

    if "teachers" in result and result["teachers"]:
        result["teacher_name"] = result["teachers"].get("full_name")
    else:
        result["teacher_name"] = None
    result.pop("teachers", None)

    # student_classes(count) → student_count
    sc = result.get("student_classes")
    if isinstance(sc, list) and sc:
        result["student_count"] = sc[0].get("count", 0)
    else:
        result["student_count"] = 0
    result.pop("student_classes", None)
    return result


def _get_teacher_row(uid: str):
    supabase = get_supabase()
    return fetch_one(supabase.table("teachers").select("id").eq("user_id", uid))


def _get_student_row(uid: str):
    supabase = get_supabase()
    return fetch_one(supabase.table("students").select("id").eq("user_id", uid))


# ── My classes (student/teacher) ──────────────────────────────────────────────

@router.get("/my", response_model=List[ClassResponse])
def get_my_classes(user=Depends(require_authenticated), role: str = Depends(get_user_role)):
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
            supabase.table("classes")
            .select("*, subjects(subject_name), teachers(full_name), student_classes(count)")
            .in_("id", class_ids)
            .execute()
        )
        return [_flatten_class(r) for r in res.data]

    elif role == "teacher":
        teacher = _get_teacher_row(user.id)
        if not teacher:
            return []
        res = (
            supabase.table("classes")
            .select("*, subjects(subject_name), teachers(full_name), student_classes(count)")
            .eq("teacher_id", teacher["id"])
            .execute()
        )
        return [_flatten_class(r) for r in res.data]

    # Admin gets all
    res = supabase.table("classes").select("*, subjects(subject_name), teachers(full_name), student_classes(count)").execute()
    return [_flatten_class(r) for r in res.data]


# ── Student self-enrollment ────────────────────────────────────────────────────

@router.post("/join", response_model=StudentClassResponse, status_code=status.HTTP_201_CREATED)
def join_class(body: StudentClassJoin, user=Depends(require_authenticated)):
    supabase = get_supabase()
    student = _get_student_row(user.id)
    if not student:
        raise HTTPException(status_code=403, detail="Only students can join classes")

    cls_row = fetch_one(
        supabase.table("classes").select("id").eq("join_code", body.join_code)
    )
    if not cls_row:
        raise HTTPException(status_code=404, detail="Invalid join code")

    class_id = cls_row["id"]
    student_id = student["id"]

    # Check for existing enrollment
    existing = fetch_one(
        supabase.table("student_classes")
        .select("id")
        .eq("student_id", student_id)
        .eq("class_id", class_id)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already enrolled in this class")

    res = (
        supabase.table("student_classes")
        .insert({"student_id": student_id, "class_id": class_id})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=400, detail="Enrollment failed")
    return res.data[0]


@router.delete("/{class_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_class(class_id: str, user=Depends(require_authenticated)):
    supabase = get_supabase()
    student = _get_student_row(user.id)
    if not student:
        raise HTTPException(status_code=403, detail="Only students can leave classes")
    res = (
        supabase.table("student_classes")
        .delete()
        .eq("student_id", student["id"])
        .eq("class_id", class_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Enrollment not found")


# ── Admin CRUD ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ClassResponse])
def list_classes(user=Depends(require_admin)):
    supabase = get_supabase()
    res = (
        supabase.table("classes")
        .select("*, subjects(subject_name), teachers(full_name), student_classes(count)")
        .execute()
    )
    return [_flatten_class(r) for r in res.data]


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(body: ClassCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    data = body.model_dump()
    data["subject_id"] = str(data["subject_id"])
    data["teacher_id"] = str(data["teacher_id"])
    data["term_id"] = str(data["term_id"])
    res = supabase.table("classes").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create class")
    # Re-fetch with joins
    created_id = res.data[0]["id"]
    full = fetch_one(
        supabase.table("classes")
        .select("*, subjects(subject_name), teachers(full_name), student_classes(count)")
        .eq("id", created_id)
    )
    return _flatten_class(full)


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: str, body: ClassUpdate, user=Depends(require_admin)):
    supabase = get_supabase()
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    for k in ("subject_id", "teacher_id", "term_id"):
        if k in update_data:
            update_data[k] = str(update_data[k])
    res = supabase.table("classes").update(update_data).eq("id", class_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Class not found")
    full = fetch_one(
        supabase.table("classes")
        .select("*, subjects(subject_name), teachers(full_name), student_classes(count)")
        .eq("id", class_id)
    )
    return _flatten_class(full)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("classes").delete().eq("id", class_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Class not found")


# ── Admin enrollment management ───────────────────────────────────────────────

@router.get("/{class_id}/students", response_model=List[StudentResponse])
def list_class_students(class_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = (
        supabase.table("student_classes")
        .select("students(*)")
        .eq("class_id", class_id)
        .execute()
    )
    return [row["students"] for row in res.data if row.get("students")]


@router.post("/{class_id}/enroll", response_model=StudentClassResponse, status_code=status.HTTP_201_CREATED)
def admin_enroll(class_id: str, body: StudentClassCreate, user=Depends(require_admin)):
    supabase = get_supabase()
    existing = fetch_one(
        supabase.table("student_classes")
        .select("id")
        .eq("student_id", str(body.student_id))
        .eq("class_id", class_id)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Student already enrolled")
    res = (
        supabase.table("student_classes")
        .insert({"student_id": str(body.student_id), "class_id": class_id})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=400, detail="Enrollment failed")
    return res.data[0]


@router.delete("/{class_id}/enroll/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_unenroll(class_id: str, student_id: str, user=Depends(require_admin)):
    supabase = get_supabase()
    res = (
        supabase.table("student_classes")
        .delete()
        .eq("student_id", student_id)
        .eq("class_id", class_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Enrollment not found")
