# CampusFlow - LLM Context

This file serves as the definitive context map for any LLM working on the CampusFlow project. **Read this file first before making changes or proposing new features.**

## 1. General Instructions
- **Stack:** Next.js 14 App Router (React/TypeScript) for Frontend, FastAPI (Python) for Backend, Supabase (PostgreSQL) for Database & Auth.
- **Data Access:** Simple CRUD → `@supabase/ssr` in Next.js Server Actions / Client hooks. Complex logic (conflict detection, availability queries) → FastAPI backend. AI processing (OCR) → FastAPI backend (future).
- **Design System First:** Always use the existing components in `frontend/src/components/ui/` before building new ones. All components should use the custom glassmorphism tokens.
- **Styling Method:** TailwindCSS + custom classes in `globals.css`. Use `cn()` for class merging.
- **Backend auth pattern:** Every protected route uses a FastAPI `Depends(...)` guard. Auth guards live in `backend/auth/guards.py`; the JWT dependency is in `backend/auth/dependencies.py`. The backend always uses the Supabase service-role key (bypasses RLS), and manually filters by `user_id` for scoped queries.

## 2. UI Theme & Consistency
- **Aesthetic:** High-end glassmorphism, dynamic, and premium.
- **Colors:**
  - Background: Very dark blue/black (`#0a0a0f`)
  - Surface: Semi-transparent white (`rgba(255, 255, 255, 0.03)`) with 1px border (`rgba(255, 255, 255, 0.05)`)
  - Accents: Vibrant Purple (`#8b5cf6`) and Cyan (`#06b6d4`)
  - Text: Clean white for primary, gray-400 for muted.
- **Core CSS Class:** Use `.glass-panel` for the standard blurred card look. Or use the `<GlassCard>` wrapper component.
- **Typography:** Uses the 'Inter' font. Keep text tracking slightly tight for headers.

## 3. Features Implemented Till Now

### Database
- **Schema:** No `profiles` table — identity is split per role into `students`, `teachers`, `admins` (each linked to `auth.users` via nullable `user_id`). Plus `subjects`, `terms`, `classes`, `student_classes`, `classrooms`, `timetable_slots`, `announcements`, `assignments`, `marks`. RLS active on every table.
- **Join codes:** `classes.join_code` (8-char) and `terms.join_code` (6-char) — auto-generated via `generate_join_code()` DB function. Added in migration `001_add_join_codes.sql`.
- **Role resolution:** `auth_role()` RPC returns `'admin' | 'teacher' | 'student'`. Used by middleware and RLS policies.
- **Triggers:** `handle_new_user` (auto-provisions student/teacher on signup), `set_updated_at` (all tables), `sync_slot_from_class` (keeps `timetable_slots.teacher_id/term_id` synced with parent class).
- **Conflict constraints:** `EXCLUDE USING gist` with `int4range` on `timetable_slots` — `no_classroom_overlap` and `no_teacher_overlap` catch DB-level double-bookings.
- **Student self-enrollment RLS:** `"Students can self-enroll"` (INSERT) and `"Students can unenroll self"` (DELETE) on `student_classes`.

### Backend (FastAPI)
- **Auth middleware:** `backend/auth/dependencies.py` — `get_current_user` (JWT Bearer → Supabase user), `get_user_role` (queries role tables). `backend/auth/guards.py` — `require_authenticated`, `require_admin`, `require_teacher`, `require_student`, `require_teacher_or_admin`.
- **Schemas (`backend/schemas/`):** One file per table with `Create`, `Update`, `Response` models: `students`, `teachers`, `subjects`, `terms`, `classrooms`, `classes`, `student_classes`, `timetable_slots`, `announcements`, `assignments`, `marks`.
- **Routers (`backend/routers/`):** Full CRUD for all entities; complete router list:
  - `students.py` — self-service (`GET/PUT /students/me`) + admin CRUD
  - `teachers.py` — admin CRUD
  - `subjects.py` — admin CRUD
  - `terms.py` — admin CRUD with `?active_only` filter
  - `classrooms.py` — admin CRUD
  - `classes.py` — admin CRUD + student self-enrollment (`POST /classes/join`, `DELETE /classes/{id}/leave`) + admin enrollment management
  - `announcements.py` — teacher/admin CRUD, student read
  - `assignments.py` — teacher/admin CRUD, student read
  - `marks.py` — teacher/admin write, student read own
  - `timetable_slots.py` — full read (any auth user), admin/teacher write with **two-layer conflict detection**
- **Conflict detection (`backend/utils/conflict.py`):** Layer 1 (API pre-check) uses time-range overlap `max(s1,s2) < min(e1,e2)`; checks classroom AND teacher conflicts with friendly error messages. Layer 2 = DB EXCLUDE constraints (catch race conditions). `exclude_slot_id` param enables update-without-self-conflict.
- **Key timetable endpoints:**
  - `GET /timetable/my` — student gets enrolled-class slots; teacher gets own slots
  - `GET /timetable/classrooms/available` — Free Room Finder (day, start_time, end_time, term_id)
  - `GET /timetable/teacher-availability` — busy/free windows by day within 08:00–18:00
- **Tests (`backend/tests/`):** `seed_data.py` (populates all 12 tables with inter-linked sample data + teardown); `test_api.py` (HTTP tests for auth guards, route existence, Swagger; DB-direct tests for conflict logic, constraint enforcement, CRUD).

### Frontend
- **Auth System:** Next.js Middleware with `@supabase/ssr`. Role-based routing. Custom `AuthLayout`, `Login`, `Register` pages.
- **Dashboard Layout:** Dynamic `DashboardLayout` — sidebar adjusts per role.
- **Timetable Core UI:** Custom `<TimetableGrid />` — absolute-positioned, renders variable-length slots.
- **Admin CRUD pages:** `/admin/students`, `/admin/teachers`, `/admin/classes`, `/admin/classrooms` — use reusable `<DataTable />` and `<Modal />`.
- **UI Shells:** Placeholder pages for Virtual Classroom, OCR Engine, Interactive Campus Map.

## 4. Features Remaining (Pending Implementation)

### Frontend integrations (Release 1 continuation)
- Wire `<TimetableGrid />` to call `GET /timetable/my` from FastAPI — replace any mock/static data.
- Wire Admin CRUD modals to call the new FastAPI endpoints (POST/PUT/DELETE for students, teachers, classes, classrooms) instead of calling Supabase directly.
- Show conflict error toasts when timetable slot creation returns a 409.
- Build UI for **Free Room Finder** (`/timetable/classrooms/available`) and **Teacher Availability** (`/timetable/teacher-availability`).
- Student self-enrollment UI — input `join_code` → `POST /classes/join`.

### Polish (Release 2)
- Empty states, loading skeletons, toast notifications.
- Virtual Classroom portal (announcements, assignments, grading) — backend endpoints are ready.
- Responsive QA on mobile.

## 5. Extra Features (Vision / Future)
- **OCR Intelligence:** Upload timetable images/PDFs → auto-create DB records.
- **Interactive 3D Campus Map:** Live room occupancy from current timetable.

## 6. Backend File Map
```
backend/
├── auth/
│   ├── dependencies.py    # get_current_user, get_user_role
│   └── guards.py          # require_admin, require_teacher, require_student, require_teacher_or_admin
├── migrations/
│   └── 001_add_join_codes.sql
├── routers/
│   ├── announcements.py
│   ├── assignments.py
│   ├── classes.py
│   ├── classrooms.py
│   ├── marks.py
│   ├── students.py
│   ├── subjects.py
│   ├── teachers.py
│   ├── terms.py
│   └── timetable_slots.py   # primary timetable router (replaces timetable.py)
├── schemas/
│   ├── announcements.py
│   ├── assignments.py
│   ├── classes.py
│   ├── classrooms.py
│   ├── marks.py
│   ├── student_classes.py
│   ├── students.py
│   ├── subjects.py
│   ├── teachers.py
│   ├── terms.py
│   └── timetable_slots.py   # replaces timetable.py
├── tests/
│   ├── seed_data.py
│   └── test_api.py
├── utils/
│   └── conflict.py          # two-layer timetable conflict detection
├── config.py
├── main.py
└── requirements.txt
```

## 7. How to Update this LLM-Context
1. Move completed features from "Features Remaining" → "Features Implemented".
2. Add new design tokens or UI paradigms to section 2.
3. Note any new dependency, table, or architectural pattern under section 1.
4. Update the file map in section 6 when files are added/moved.
5. Keep all descriptions concise and bulleted.
