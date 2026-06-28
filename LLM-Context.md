# CampusFlow - LLM Context

This file serves as the definitive context map for any LLM working on the CampusFlow project. **Read this file first before making changes or proposing new features.**

## 1. General Instructions
- **Stack:** Next.js 15 App Router (React 19/TypeScript) for Frontend, FastAPI (Python) for Backend, Supabase (PostgreSQL + Auth) for Database & Auth.
- **Data Access (current):** The frontend talks to the backend through **one path** — a typed `apiFetch` client (`frontend/src/lib/api/client.ts`) that attaches the Supabase session JWT as a Bearer token and calls FastAPI. All reads and writes flow through FastAPI; the browser only ever holds the Supabase **anon** key + the user's session JWT. The mock-data layer has been fully removed from the pages.
- **Design System First:** Always use existing components in `frontend/src/components/ui/` before building new ones. All components MUST use glassmorphism tokens.
- **Styling Method:** TailwindCSS v4 + custom classes in `globals.css`. Use `cn()` for class merging.
- **Backend auth pattern:** Every protected route uses a FastAPI `Depends(...)` guard. Guards live in `backend/auth/guards.py`; the JWT dependency is in `backend/auth/dependencies.py`. The backend always uses the Supabase **service-role** key (bypasses RLS) and manually scopes queries by the resolved user/role.

## 2. UI Theme & Consistency
- **Aesthetic:** High-end glassmorphism, dynamic, premium, dark. Every surface uses `.glass-panel`.
- **Colors:**
  - Background: `#0a0a0f` (very dark blue-black)
  - Surface: `rgba(255,255,255,0.03)` + 1px border `rgba(255,255,255,0.05)` via `.glass-panel`
  - Accents: Purple `#8b5cf6` (primary) and Cyan `#06b6d4` (secondary/info)
  - Text: white for primary, `gray-400` for muted
- **Glass variants in globals.css:** `.glass-panel`, `.glass-panel-hover`, `.glass-matte`, `.glass-soft`, `.glass-frost` (matte grain — also used for timetable slots), `.glass-sheen`.
- **Animations:** Framer Motion for page/card/modal transitions and tab switches. CSS for aurora/float/scan/pulse.
- **Toast System:** Global Zustand store (`src/store/toastStore.ts`) + `<ToastContainer />` in root layout. Mutation hooks fire success toasts and surface backend error details (including `409` conflicts) automatically.

## 3. Frontend Data Layer (the integration spine)

Located in `frontend/src/lib/api/`:

- **`client.ts`** — `apiFetch` + `api.{get,post,put,del}` + `qs()`. Pulls the JWT from the Supabase browser client, sets `Authorization: Bearer`, prefixes `NEXT_PUBLIC_API_URL`, throws a typed `ApiError(status, detail)` on non-2xx.
- **`types.ts`** — `Raw*` types mirror backend responses exactly; **view types** keep the denormalized shape the UI renders (`Subject.name`/`.code`, `Classroom.type`, joined `subject_name`/`room_number`, `student_count`). Mappers (`toStudent`, `toSubject`, …) and enrichers (`enrichSlot`, `enrichAnnouncement`, `enrichAssignment`, `enrichMark`) bridge the two. `ROOM_TYPE_LABELS` maps backend `room_type` (`lecture`/`lab`/`seminar`/`auditorium`/`tutorial`) ⇄ display labels.
- **`resources.ts`** — thin typed CRUD functions per entity (`students`, `teachers`, `subjects`, `terms`, `classrooms`, `classes`, `timetable`, `announcements`, `assignments`, `marks`, `auth.role`).
- **`hooks.ts`** — TanStack Query hooks. Catalog queries (`useStudents`, …), `useRole`, enriched queries (`useMyTimetable`, `useTimetable`, `useAnnouncements`, `useAssignments`, `useStudentMarks`, `useMarksForAssignments`, `useFreeRooms`, `useTeacherAvailability`), and CRUD **mutation hooks** (`useStudentMutations`, …, `useSlotMutations`, `useSetActiveTerm`, `useEnrollmentMutations`, `useJoinClass`) that toast + invalidate on success.
- **Enrichment is client-side** via lookup maps built from `useMyClasses` (works for every role — admin gets all classes, teacher/student get their own) + `useClassrooms`. No admin-only endpoints are required to label slots/announcements for non-admins.
- **`components/providers/QueryProvider.tsx`** wraps the app in the root layout.

## 4. Features Implemented

### Database
- **Schema:** No `profiles` table — identity split per role into `students`, `teachers`, `admins`. Plus `subjects`, `terms`, `classes`, `student_classes`, `classrooms`, `timetable_slots`, `announcements`, `assignments`, `marks`. RLS active on every table.
- **Join codes:** `classes.join_code` (8-char) and `terms.join_code` (6-char) — auto-generated.
- **Role resolution:** `auth_role()` RPC. `handle_new_user` trigger reads `role`/`full_name` from signup metadata and creates the matching `students`/`teachers` row.
- **Conflict constraints:** `EXCLUDE USING gist` on `timetable_slots`.
- **Seeded data:** project `wcvqowfuudzguuwjpltl` has a full dataset (1 admin, 5 teachers, 10 students, 8 subjects, 1 term, 6 classrooms, 8 classes, 25 slots, announcements/assignments/marks). All 16 auth logins share password `campusflow123` (e.g. `admin@campusflow.edu`, `sharma@campusflow.edu`, `aarav@campusflow.edu`).

### Backend (FastAPI)
- Full CRUD for all 10 entities via 10 routers + `GET /auth/role`.
- Two-layer timetable conflict detection (API pre-check + DB `EXCLUDE`).
- `utils/db.py::fetch_one()` — safe single-row helper (supabase-py 2.31 returns `None`, not `data=None`, on zero rows; raw `.maybe_single().execute().data` would 500).
- `ClassResponse.student_count` populated via `student_classes(count)` aggregate.
- `GET /classrooms` is open to any authenticated user (room directory); classroom writes stay admin-only.
- CORS configured via `CORS_ORIGINS` (`.env`); `load_dotenv()` runs at the top of `main.py`.

### Frontend (Live — wired to FastAPI)
- **Auth:** Supabase SSR + middleware. Login redirects by role (`/admin/students` | `/teacher` | `/student`); register → `signUp` with role metadata. `(dashboard)/layout.tsx` resolves role server-side. `NEXT_PUBLIC_DEV_BYPASS` exists only as a dev escape hatch (default `false`).
- **Admin pages** (`/admin/students|teachers|classes|classrooms|subjects|terms`): live CRUD via mutation hooks, search/filter, confirm dialogs, skeleton loaders, stat cards. Classes show real `student_count`, dropdowns from live subjects/teachers/terms, expandable roster (`/classes/{id}/students`), enroll modal.
- **Timetable** (`/timetable`): grid from `/timetable/my` (enriched), role-gated add/delete slot with **409 conflict toasts**, Free Room Finder (`/timetable/classrooms/available`), Teacher Availability (computed from visible slots). Filters derived role-safely from visible data.
- **Student Dashboard** (`/student`): real profile name, class-scoped today's classes / assignments / announcements, weekly timetable.
- **Teacher Dashboard** (`/teacher`): my classes + today's schedule from `/classes/my` + `/timetable/my`; Post Announcement / Create Assignment wired to live endpoints.
- **Class hub** (`/class`, `/class/[classId]`): selector from `/classes/my` with join-code modal (`POST /classes/join`); hub tabs — announcements, assignments, and grades (teacher sees the full roster×assignment grid; student sees their own marks via `/marks/student/{id}`).

## 5. Features Remaining
- **Polish:** responsive QA (320–768px); empty/error-state pass on a few secondary views.
- **Future:** OCR Engine (Release 3) and Campus Map (Release 4) pages are still placeholders.
- **Deploy (Release 5):** address Supabase security advisors (move `btree_gist` out of `public`, enable leaked-password protection), set production `CORS_ORIGINS`, deploy frontend (Vercel) + backend (Render/Railway).

## 6. Routes Per Role

| Role | Routes |
|------|--------|
| Admin | `/admin/students`, `/admin/teachers`, `/admin/classes`, `/admin/classrooms`, `/admin/subjects`, `/admin/terms`, `/timetable`, `/class`, `/ocr`, `/map` |
| Teacher | `/teacher`, `/timetable`, `/class`, `/class/[classId]` |
| Student | `/student`, `/timetable`, `/class`, `/class/[classId]` |

## 7. Running Locally
```
# Backend (from backend/, venv active)
uvicorn main:app --reload          # http://localhost:8000, docs at /docs
# Frontend (from frontend/)
npm run dev                         # http://localhost:3000 (or :3001)
```
`backend/.env` needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`.
`frontend/.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.

## 8. File Map

```
frontend/src/
├── app/
│   ├── layout.tsx                        # Root layout (QueryProvider + ToastContainer)
│   ├── (auth)/{login,register}/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                    # Server-side role resolution → DashboardLayout
│       ├── admin/{students,teachers,classes,classrooms,subjects,terms}/page.tsx
│       ├── timetable/page.tsx
│       ├── student/page.tsx
│       ├── teacher/page.tsx
│       └── class/{page.tsx,[classId]/page.tsx}
├── components/
│   ├── ui/                               # GlassCard, Button, DataTable, Modal, Badge,
│   │                                     # SearchBar, FilterDropdown, StatCard, EmptyState,
│   │                                     # SkeletonLoader, Tabs, ConfirmDialog, Toast
│   ├── providers/QueryProvider.tsx       # TanStack Query client
│   ├── layout/{DashboardLayout,Sidebar}.tsx
│   └── timetable/{TimetableGrid,CalendarView}.tsx
├── store/toastStore.ts
├── lib/
│   ├── api/{client,types,resources,hooks}.ts   # ← the integration layer
│   └── supabase/{client,server}.ts
├── middleware.ts
└── utils/cn.ts
```

```
backend/
├── auth/{dependencies,guards}.py
├── routers/ (10 routers — full CRUD)
├── schemas/ (11 schema files)
├── utils/{conflict,db}.py                # db.py::fetch_one()
├── tests/{seed_data,test_api}.py         # 45 assertions, all pass
├── config.py
└── main.py                               # CORS, load_dotenv, GET /auth/role
```

## 9. How to Update this LLM-Context
1. Move completed features from "Remaining" → "Implemented".
2. Note new endpoints/hooks under sections 3–4.
3. Keep the file map current when files are added/moved.
4. Keep descriptions concise and bulleted.
