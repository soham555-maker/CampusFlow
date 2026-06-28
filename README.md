# 🎓 CampusFlow

> **A premium, full-stack campus management platform** — built with Next.js 15, FastAPI, and Supabase.

CampusFlow centralises timetable management, role-based administration, and future-ready features like OCR-based schedule ingestion and an interactive 3D campus map — all in a single, cohesive glassmorphism-styled platform.

---

## ✨ Features

### ✅ Implemented
| Area | Details |
|------|---------|
| **Authentication** | Supabase Auth with Next.js middleware. Role-based routing: `Student`, `Teacher`, `Admin` |
| **Database Schema** | 12 tables with full RLS. Per-role identity (`students`/`teachers`/`admins`). `handle_new_user` trigger auto-provisions rows on signup. |
| **Join Codes** | `classes.join_code` and `terms.join_code` — auto-generated. Students self-enroll via `POST /classes/join`. |
| **Conflict Detection** | Two-layer: API pre-check (room + teacher overlap) + PostgreSQL `EXCLUDE USING gist` DB constraint |
| **Complete REST API** | 35 endpoints across 10 routers — full CRUD for every entity |
| **Auth Middleware** | FastAPI JWT Bearer dependency + role guards (`require_admin`, `require_teacher`, etc.) |
| **Dashboard Layout** | Role-aware dynamic sidebar with all role-specific links |
| **Timetable Grid** | Custom `<TimetableGrid />` with matte grainy glass slots, click-to-add for admin/teacher |
| **Mega Timetable Page** | Unified `/timetable` with Grid view + Free Room Finder + Teacher Availability tabs |
| **Admin CRUD (6 pages)** | Students, Teachers, Classes, Classrooms, Subjects, Terms — all with full CRUD, search/filter, confirm dialogs |
| **Student Dashboard** | Today's classes, upcoming assignments, recent announcements, weekly timetable |
| **Teacher Dashboard** | My classes, today's schedule, post announcement, create assignment, weekly timetable |
| **Class Hub** | `/class` selector grid + `/class/[classId]` with Announcements, Assignments, Grades tabs |
| **Toast System** | Zustand global store + glass-styled toast container |
| **UI Component Library** | 13 components: GlassCard, Button, DataTable, Modal, Badge, SearchBar, FilterDropdown, StatCard, EmptyState, SkeletonLoader, Tabs, ConfirmDialog, Toast |
| **Live API Integration** | Every page is wired to FastAPI via a typed `apiFetch` client + **TanStack Query**. JWT-authenticated, role-scoped, with toast + cache-invalidation on every mutation. (`frontend/src/lib/api/`) |
| **Conflict UX** | Adding/updating a slot surfaces backend `409` room/teacher double-booking errors as toasts |
| **Test Suite** | `seed_data.py` + `test_api.py` — 45 assertions (auth guards, conflict logic, DB constraints, triggers) |

> **Note:** The frontend is fully wired to the live backend. The former `mockData.ts` layer has been removed; data flows browser → `apiFetch` (Bearer JWT) → FastAPI → Supabase.

### 🔲 Pending
- Mobile responsive QA (320–768px)
- OCR Engine (Release 3) and Campus Map (Release 4) pages — currently placeholders
- Pre-deploy: address Supabase security advisors, set production `CORS_ORIGINS`

### 🔮 Future Vision
- **OCR Intelligence** — upload a timetable image/PDF → auto-create DB records
- **Interactive 3D Campus Map** — live room occupancy from current timetable

---

## 📄 Pages & Routes

| Role | Route | Description |
|------|-------|-------------|
| **Admin** | `/admin/students` | Manage students — full CRUD, search, filter |
| Admin | `/admin/teachers` | Manage teachers — full CRUD |
| Admin | `/admin/classes` | Manage classes — CRUD, enroll students |
| Admin | `/admin/classrooms` | Manage rooms — CRUD, filter by type |
| Admin | `/admin/subjects` | Manage subjects + credits |
| Admin | `/admin/terms` | Manage terms — set active, CRUD |
| Admin + Teacher | `/timetable` | Mega timetable — grid, free rooms, teacher availability |
| **Teacher** | `/teacher` | Dashboard — my classes, today's schedule, actions |
| Teacher + Student | `/class` | Class selector grid + join with code |
| Teacher + Student | `/class/[classId]` | Class hub — announcements, assignments, grades |
| **Student** | `/student` | Dashboard — today's classes, assignments, announcements |
| All | `/timetable` | Weekly timetable view |

## 🏗️ Architecture

```
CampusFlow/
├── frontend/                  # Next.js 15 App Router (React 19 + TypeScript)
│   ├── src/
│   │   ├── app/               # Pages & layouts (App Router)
│   │   │   ├── (auth)/        # Login & Register pages
│   │   │   └── (dashboard)/   # Protected dashboard routes
│   │   │       ├── admin/     # students, teachers, classes, classrooms, subjects, terms
│   │   │       ├── timetable/ # Mega timetable page
│   │   │       ├── teacher/   # Teacher dashboard
│   │   │       ├── student/   # Student dashboard
│   │   │       └── class/     # Class hub ([classId] dynamic route)
│   │   ├── components/
│   │   │   ├── ui/            # 13 reusable glass-panel components
│   │   │   ├── providers/     # QueryProvider (TanStack Query)
│   │   │   ├── layout/        # DashboardLayout, Sidebar
│   │   │   ├── timetable/     # TimetableGrid, CalendarView
│   │   │   └── landing/       # Landing page components
│   │   ├── store/             # Zustand stores (toastStore)
│   │   ├── lib/
│   │   │   ├── api/           # client, types, resources, hooks (the integration layer)
│   │   │   └── supabase/      # Client + server helpers (@supabase/ssr)
│   │   └── middleware.ts      # Auth & role-based route protection
│   └── package.json
│
├── backend/                   # FastAPI (Python)
│   ├── auth/
│   │   ├── dependencies.py    # get_current_user, get_user_role
│   │   └── guards.py          # Role guard dependencies
│   ├── routers/               # 10 routers — full CRUD for all entities
│   ├── schemas/               # Pydantic models (one file per table)
│   ├── tests/
│   │   ├── seed_data.py       # DB seed + teardown
│   │   └── test_api.py        # Integration tests
│   ├── utils/
│   │   ├── conflict.py        # Two-layer conflict detection logic
│   │   └── db.py             # fetch_one() safe single-row helper
│   ├── config.py
│   ├── main.py               # CORS, load_dotenv, GET /auth/role
│   └── requirements.txt
│
├── supabase_schema.sql        # Full DB schema (tables, RLS, triggers, functions)
├── LLM-Context.md             # AI assistant context map (read this first)
└── README.md
```

### Data-Access Pattern
All dynamic data flows through **one path**: the browser's `apiFetch` client attaches the Supabase session JWT and calls FastAPI, which uses the service-role key and scopes every query by the resolved role.

| Use case | Layer |
|----------|-------|
| All reads & writes | `apiFetch` (Bearer JWT) → FastAPI → Supabase |
| Client cache / loading / refetch | TanStack Query hooks (`frontend/src/lib/api/hooks.ts`) |
| Conflict-heavy writes (timetable slots) | FastAPI two-layer conflict check → `409` → toast |
| Auth & role resolution | Supabase Auth (login/signup) + `GET /auth/role` |
| AI / OCR processing | FastAPI backend (future) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **Styling** | TailwindCSS v4, custom glassmorphism tokens, Framer Motion |
| **Data / State / Forms** | TanStack Query (server state), Zustand (toasts), React Hook Form, Zod |
| **Backend** | FastAPI, Uvicorn, Pydantic v2 |
| **Database & Auth** | Supabase (PostgreSQL + Auth + RLS) |
| **HTTP client (tests)** | httpx |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A [Supabase](https://supabase.com) project (free tier works)

---

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/CampusFlow.git
cd CampusFlow
```

---

### 2. Database Setup

1. Open your Supabase project → **SQL Editor**
2. Paste and run [`supabase_schema.sql`](./supabase_schema.sql) — creates all tables, constraints, RLS, triggers
3. Paste and run [`backend/migrations/001_add_join_codes.sql`](./backend/migrations/001_add_join_codes.sql) — adds join codes + student self-enrollment policies

---

### 3. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create **`backend/.env`**:
```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
CORS_ORIGINS=http://localhost:3000   # comma-separated for multiple origins
```

Start the dev server:
```bash
uvicorn main:app --reload
# API at http://localhost:8000
# Swagger at http://localhost:8000/docs
```

Run tests (requires real Supabase credentials):
```bash
python -m tests.test_api
```

---

### 4. Frontend Setup (Next.js)

```bash
cd frontend
npm install
```

Create **`frontend/.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>     # anon key — NOT the service-role key
NEXT_PUBLIC_API_URL=http://localhost:8000          # FastAPI base URL
```

> Make sure the backend's `CORS_ORIGINS` includes the frontend's origin (`http://localhost:3000` or `:3001`).

```bash
npm run dev
# App at http://localhost:3000
```

**Test logins** (seeded project): every account uses password `campusflow123` — e.g. `admin@campusflow.edu`, `sharma@campusflow.edu` (teacher), `aarav@campusflow.edu` (student).

---

## 🎨 UI Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` (very dark blue-black) |
| Surface | `rgba(255,255,255,0.03)` + `1px` border `rgba(255,255,255,0.05)` |
| Accent Purple | `#8b5cf6` |
| Accent Cyan | `#06b6d4` |
| Primary Text | `white` |
| Muted Text | `gray-400` |
| Font | Inter (Google Fonts) |

Use **`.glass-panel`** or **`<GlassCard>`** for cards. Use **`cn()`** for class merging.

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | — | Health check |
| `GET` | `/auth/role` | Any | Current user's role (`admin`/`teacher`/`student`) |
| `GET` | `/students/me` | Student | Own profile |
| `PUT` | `/students/me` | Student | Update own profile |
| `GET/POST` | `/students` | Admin | List / create students |
| `GET/PUT/DELETE` | `/students/{id}` | Admin | Get / update / delete |
| `GET/POST` | `/teachers` | Admin | List / create teachers |
| `GET/PUT/DELETE` | `/teachers/{id}` | Admin | Get / update / delete |
| `GET/POST` | `/subjects` | Admin | List / create subjects |
| `PUT/DELETE` | `/subjects/{id}` | Admin | Update / delete |
| `GET/POST` | `/terms` | Admin | List (`?active_only`) / create |
| `PUT/DELETE` | `/terms/{id}` | Admin | Update / delete |
| `GET` | `/classrooms` | Any | List classrooms (room directory) |
| `POST` | `/classrooms` | Admin | Create classroom |
| `PUT/DELETE` | `/classrooms/{id}` | Admin | Update / delete |
| `GET` | `/classes/my` | Any | Classes for current user |
| `POST` | `/classes/join` | Student | Self-enroll by join code |
| `DELETE` | `/classes/{id}/leave` | Student | Unenroll self |
| `GET/POST` | `/classes` | Admin | List (with joins) / create |
| `PUT/DELETE` | `/classes/{id}` | Admin | Update / delete |
| `GET` | `/classes/{id}/students` | Admin | List enrolled students |
| `POST` | `/classes/{id}/enroll` | Admin | Force-enroll a student |
| `DELETE` | `/classes/{id}/enroll/{sid}` | Admin | Force-unenroll |
| `GET` | `/timetable` | Any | All slots (`?term_id`) |
| `GET` | `/timetable/my` | Any | Slots for current user |
| `GET` | `/timetable/teacher/{id}` | Any | Slots by teacher |
| `GET` | `/timetable/student/{id}` | Any | Slots by student |
| `GET` | `/timetable/classrooms/available` | Any | Free Room Finder |
| `GET` | `/timetable/teacher-availability` | Any | Teacher free/busy windows |
| `POST` | `/timetable` | Teacher/Admin | Create slot (conflict-checked) |
| `PUT` | `/timetable/{id}` | Teacher/Admin | Update slot (conflict-checked) |
| `DELETE` | `/timetable/{id}` | Teacher/Admin | Delete slot |
| `POST` | `/timetable/check-conflicts` | — | Conflict pre-check |
| `GET/POST` | `/announcements` | Any/Teacher | List / create |
| `PUT/DELETE` | `/announcements/{id}` | Teacher/Admin | Update / delete |
| `GET/POST` | `/assignments` | Any/Teacher | List / create |
| `PUT/DELETE` | `/assignments/{id}` | Teacher/Admin | Update / delete |
| `GET` | `/marks` | Teacher/Admin | Marks for an assignment |
| `GET` | `/marks/student/{id}` | Any | Student's marks |
| `POST` | `/marks` | Teacher/Admin | Grade a student |
| `PUT` | `/marks/{id}` | Teacher/Admin | Update grade |

> Full interactive docs at **`http://localhost:8000/docs`** when the backend is running.

---

## 🔒 Environment Variables

### `backend/.env`
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** service-role key (server-side only) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default: `http://localhost:3000`) |

### `frontend/.env.local`
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for browser) |

> ⚠️ **Never commit `.env` files.** They are excluded by `.gitignore`.

---

## 📁 Key Files for AI Assistants

Read **[`LLM-Context.md`](./LLM-Context.md)** first. It contains the authoritative context map, file-by-file descriptions, implemented vs. pending features, and the backend auth pattern.

---

## 📄 License

This project is private. All rights reserved.
