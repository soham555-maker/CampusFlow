# CampusFlow - LLM Context

This file serves as the definitive context map for any LLM working on the CampusFlow project. **Read this file first before making changes or proposing new features.**

## 1. General Instructions
- **Stack:** Next.js 15 App Router (React 19/TypeScript) for Frontend, FastAPI (Python) for Backend, Supabase (PostgreSQL) for Database & Auth.
- **Data Access:** Simple CRUD → `@supabase/ssr` in Next.js Server Actions / Client hooks. Complex logic (conflict detection, availability queries) → FastAPI backend. AI processing (OCR) → FastAPI backend (future).
- **Design System First:** Always use existing components in `frontend/src/components/ui/` before building new ones. All components MUST use glassmorphism tokens.
- **Styling Method:** TailwindCSS v4 + custom classes in `globals.css`. Use `cn()` for class merging.
- **Mock Data:** All frontend pages currently use static mock data from `frontend/src/lib/mockData.ts`. Replace with real API calls in Release 2.
- **Backend auth pattern:** Every protected route uses a FastAPI `Depends(...)` guard. Auth guards live in `backend/auth/guards.py`; the JWT dependency is in `backend/auth/dependencies.py`. The backend always uses the Supabase service-role key (bypasses RLS), and manually filters by `user_id` for scoped queries.

## 2. UI Theme & Consistency
- **Aesthetic:** High-end glassmorphism, dynamic, premium, dark. Every surface uses `.glass-panel`.
- **Colors:**
  - Background: `#0a0a0f` (very dark blue-black)
  - Surface: `rgba(255, 255, 255, 0.03)` + 1px border `rgba(255, 255, 255, 0.05)` via `.glass-panel`
  - Accents: Purple `#8b5cf6` (primary actions) and Cyan `#06b6d4` (secondary/info)
  - Text: white for primary, `gray-400` for muted
- **Glass variants in globals.css:**
  - `.glass-panel` — standard blurred surface
  - `.glass-panel-hover` — interactive variant with hover states
  - `.glass-matte` — iOS-style frosted surface (landing page)
  - `.glass-soft` — bento tiles and role panels
  - `.glass-frost` — hero panels with matte grain overlay (also used in timetable slots)
  - `.glass-sheen` — specular edge highlight
- **Animations:** Framer Motion for page transitions, card entrances, modal animations, tab switches. CSS animations for aurora, float, scan, pulse.
- **Typography:** Inter font. Tight tracking on headers.
- **Toast System:** Global Zustand store (`src/store/toastStore.ts`) + `<ToastContainer />` in root layout.

## 3. Features Implemented

### Database
- **Schema:** No `profiles` table — identity split per role into `students`, `teachers`, `admins`. Plus `subjects`, `terms`, `classes`, `student_classes`, `classrooms`, `timetable_slots`, `announcements`, `assignments`, `marks`. RLS active on every table.
- **Join codes:** `classes.join_code` (8-char) and `terms.join_code` (6-char) — auto-generated.
- **Role resolution:** `auth_role()` RPC returns `'admin' | 'teacher' | 'student'`.
- **Triggers:** `handle_new_user`, `set_updated_at`, `sync_slot_from_class`.
- **Conflict constraints:** `EXCLUDE USING gist` on `timetable_slots`.

### Backend (FastAPI)
- Full CRUD for all 10 entities via 10 routers.
- Two-layer timetable conflict detection.
- Key endpoints: `GET /timetable/my`, `GET /timetable/classrooms/available`, `GET /timetable/teacher-availability`.

### Frontend (Static Mock Data — Release 1)
- **Auth:** Next.js Middleware + Supabase SSR. Role-based routing.
- **Mock Data:** `frontend/src/lib/mockData.ts` — 6 students, 4 teachers, 5 subjects, 2 terms, 6 classrooms, 4 classes, 8 slots, 3 announcements, 3 assignments, 5 marks (Indian engineering college setting).
- **Toast System:** Zustand store + glass-styled toast container (success/error/info/warning).
- **Admin pages:** `/admin/students`, `/admin/teachers`, `/admin/classes`, `/admin/classrooms`, `/admin/subjects` (NEW), `/admin/terms` (NEW) — all with full CRUD modals, search/filter, confirm dialogs, stat cards.
- **Timetable Page** (`/timetable`): Mega page with 3 tabs — Timetable Grid (matte grainy glass slots, click-to-add for admin/teacher), Free Room Finder (real-time overlap detection from mock data), Teacher Availability (free window computation). Filter bar with teacher/room/class/term filters.
- **Student Dashboard** (`/student`): Stat cards, Today's Classes, Upcoming Assignments, Recent Announcements, Weekly Timetable.
- **Teacher Dashboard** (`/teacher`): Stat cards, My Classes, Today's Schedule, Post Announcement modal, Create Assignment modal, Weekly Timetable.
- **Class Pages:** `/class` — card grid with join-code modal. `/class/[classId]` — class hub with 3 tabs (Announcements with expandable body, Assignments with status badges, Grades table with progress bars).
- **Sidebar:** Updated with Subjects, Terms, My Classes links. Dynamic per role (admin/teacher/student). Virtual Classroom link removed; consolidated under /timetable and /class.
- **UI Components (all in `components/ui/`):**
  - `GlassCard`, `Button`, `DataTable`, `Modal` — original components
  - `Badge` — 7 variants (default/success/error/warning/info/purple/cyan)
  - `SearchBar` — glass-styled with clear button
  - `FilterDropdown` — glass-styled native select
  - `StatCard` — animated stat with icon, value, optional trend
  - `EmptyState` — icon + title + description + optional CTA
  - `SkeletonLoader` — `Skeleton`, `TableSkeleton`, `CardSkeleton` shimmer components
  - `Tabs` — animated active indicator via Framer Motion `layoutId`
  - `ConfirmDialog` — glass delete confirmation with danger button
  - `Toast` — `ToastContainer` component (used in root layout)

## 4. Features Remaining (Release 2)

### Frontend → Backend Wiring
- Replace all mock data calls with real FastAPI/Supabase API calls.
- Wire timetable grid to `GET /timetable/my`.
- Wire Admin CRUD modals to FastAPI POST/PUT/DELETE endpoints.
- Show 409 conflict error toasts from timetable slot creation.
- Student self-enrollment UI — join code input → `POST /classes/join`.
- Grades tab in class hub → wire to `/marks` endpoints.

### Polish
- Responsive QA on mobile (320–768px breakpoints).
- Virtual Classroom placeholder → route to `/class` system.
- OCR Engine and Campus Map pages (future Releases 3 & 4).

## 5. Routes Per Role

| Role | Routes |
|------|--------|
| Admin | `/admin/students`, `/admin/teachers`, `/admin/classes`, `/admin/classrooms`, `/admin/subjects`, `/admin/terms`, `/timetable`, `/ocr`, `/map` |
| Teacher | `/teacher`, `/timetable`, `/class`, `/class/[classId]` |
| Student | `/student`, `/timetable`, `/class`, `/class/[classId]` |

## 6. File Map

```
frontend/src/
├── app/
│   ├── layout.tsx                        # Root layout (includes ToastContainer)
│   ├── page.tsx                          # Landing page
│   ├── globals.css                       # Design tokens, glass variants, animations
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                    # Auth + role detection → DashboardLayout
│       ├── admin/
│       │   ├── students/page.tsx
│       │   ├── teachers/page.tsx
│       │   ├── classes/page.tsx
│       │   ├── classrooms/page.tsx
│       │   ├── subjects/page.tsx         # NEW
│       │   └── terms/page.tsx            # NEW
│       ├── timetable/page.tsx            # Mega timetable (grid + free rooms + availability)
│       ├── student/page.tsx
│       ├── teacher/page.tsx
│       ├── class/
│       │   ├── page.tsx                  # Class selector grid
│       │   └── [classId]/page.tsx        # Class hub (announcements/assignments/grades)
│       ├── map/page.tsx
│       └── ocr/page.tsx
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── Button.tsx
│   │   ├── DataTable.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx                     # NEW
│   │   ├── SearchBar.tsx                 # NEW
│   │   ├── FilterDropdown.tsx            # NEW
│   │   ├── StatCard.tsx                  # NEW
│   │   ├── EmptyState.tsx                # NEW
│   │   ├── SkeletonLoader.tsx            # NEW
│   │   ├── Tabs.tsx                      # NEW
│   │   ├── ConfirmDialog.tsx             # NEW
│   │   └── Toast.tsx                     # NEW
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx                   # Updated (Subjects, Terms, My Classes)
│   ├── timetable/
│   │   ├── TimetableGrid.tsx
│   │   └── CalendarView.tsx
│   └── landing/
│       └── [Nav, Hero, Features, Roles, CTA, Footer, ...]
├── store/
│   └── toastStore.ts                     # NEW — Zustand toast store + useToast hook
├── lib/
│   ├── mockData.ts                       # NEW — all static mock data
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── fonts/fonts.ts
├── middleware.ts
└── utils/cn.ts
```

```
backend/
├── auth/
│   ├── dependencies.py
│   └── guards.py
├── routers/ (10 routers — full CRUD)
├── schemas/ (11 schema files)
├── tests/
├── utils/conflict.py
├── config.py
├── main.py
└── requirements.txt
```

## 7. How to Update this LLM-Context
1. Move completed features from "Remaining" → "Implemented".
2. Add new design tokens or UI paradigms to section 2.
3. Note any new dependency or architectural pattern under section 1.
4. Update the file map in section 6 when files are added/moved.
5. Keep all descriptions concise and bulleted.
