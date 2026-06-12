# 🎓 CampusFlow

> **A premium, full-stack campus management platform** — built with Next.js 14, FastAPI, and Supabase.

CampusFlow is a high-end, glassmorphism-styled web application that centralises timetable management, role-based administration, and future-ready features like OCR-based schedule ingestion and an interactive 3D campus map — all in a single, cohesive platform.

---

## ✨ Features

### ✅ Implemented
| Area | Details |
|------|---------|
| **Authentication** | Supabase Auth with Next.js middleware. Role-based routing: `Student`, `Teacher`, `Admin` |
| **Database Schema** | Per-role identity tables `students` / `teachers` / `admins` (linked to `auth.users` via `user_id`, **no `profiles` table**), plus `subjects`, `terms`, `classes`, `student_classes`, `classrooms`, `timetable_slots`, `announcements`, `assignments`, `marks` — all with Row-Level Security (RLS). Role is resolved via the `auth_role()` RPC; a `handle_new_user` trigger auto-provisions the student/teacher row on signup |
| **Conflict Detection** | PostgreSQL `EXCLUDE USING gist` with `int4range` — overlapping class-time conflicts caught at DB level |
| **Dashboard Layout** | Role-aware dynamic sidebar via `DashboardLayout`; adjusts navigation per logged-in role |
| **Timetable Grid** | Custom absolute-positioned `<TimetableGrid />` that renders variable-length time slots accurately |
| **FastAPI Backend** | Programmatic timetable conflict-checking endpoint (`/timetable/check-conflicts`) |
| **Admin CRUD** | Manage Students, Teachers, Classes, and Classrooms via reusable `<DataTable />` and `<Modal />` components |
| **UI Shell Pages** | Placeholder UIs for Virtual Classroom, OCR Engine, and Interactive Campus Map |

### 🔲 Pending / In Progress
- Free Room Finder & Teacher Availability interfaces
- Live data hookup: `TimetableGrid` ↔ FastAPI / Supabase
- Secure Admin API hookups for adding students and teachers
- Empty states, loading skeletons, toast notifications, mobile responsive QA

### 🔮 Future Vision
- **OCR Intelligence** — upload a timetable image/PDF → auto-create DB records
- **Interactive 3D Campus Map** — live room occupancy from current timetable
- **Virtual Classroom** — assignments, announcements, and grading portal

---

## 🏗️ Architecture

```
CampusFlow/
├── frontend/                  # Next.js 14 App Router (React + TypeScript)
│   ├── src/
│   │   ├── app/               # Pages & layouts (App Router)
│   │   │   ├── (auth)/        # Login & Register pages
│   │   │   ├── (dashboard)/   # Protected dashboard routes
│   │   │   │   ├── admin/     # Student, Teacher, Class, Classroom CRUD
│   │   │   │   ├── teacher/   # Teacher-specific views
│   │   │   │   └── student/   # Student-specific views
│   │   ├── components/
│   │   │   ├── ui/            # Reusable glass-panel components
│   │   │   └── timetable/     # TimetableGrid component
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Supabase client helpers (@supabase/ssr)
│   │   ├── utils/             # Utility functions (cn, etc.)
│   │   └── middleware.ts      # Auth & role-based route protection
│   ├── .env.local             # ⚠️ NOT committed — see env setup below
│   └── package.json
│
├── backend/                   # FastAPI (Python)
│   ├── routers/
│   │   └── timetable.py       # Conflict-checking API endpoints
│   ├── schemas/               # Pydantic models
│   ├── auth/                  # Auth utilities
│   ├── utils/                 # Shared helpers
│   ├── config.py              # Settings (reads from .env)
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                   # ⚠️ NOT committed — see env setup below
│
├── supabase_schema.sql        # Full DB schema with RLS policies
├── LLM-Context.md             # AI assistant context map
└── README.md
```

### Data-Access Pattern
- **Simple CRUD** → Next.js Server Actions / Client hooks using `@supabase/ssr` directly
- **Complex / conflict-heavy logic** → routed to the FastAPI backend
- **AI processing (OCR)** → FastAPI backend (future)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 19, TypeScript 5 |
| **Styling** | TailwindCSS v4, custom glassmorphism tokens, Framer Motion |
| **State / Forms** | Zustand, React Hook Form, Zod |
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **Database & Auth** | Supabase (PostgreSQL + Auth + RLS) |
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
2. Paste and run the contents of [`supabase_schema.sql`](./supabase_schema.sql)
3. This creates all tables, constraints, RLS policies, and triggers.

---

### 3. Backend Setup (FastAPI)

```bash
cd backend

# Create & activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create your **`backend/.env`** file:

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Start the dev server:

```bash
uvicorn main:app --reload
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

---

### 4. Frontend Setup (Next.js)

```bash
cd frontend
npm install
```

Create your **`frontend/.env.local`** file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Start the dev server:

```bash
npm run dev
# App available at http://localhost:3000
```

---

## 🎨 UI Design System

CampusFlow uses a **high-end glassmorphism** aesthetic:

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` (very dark blue-black) |
| Surface | `rgba(255,255,255,0.03)` + `1px` border `rgba(255,255,255,0.05)` |
| Accent Purple | `#8b5cf6` |
| Accent Cyan | `#06b6d4` |
| Primary Text | `white` |
| Muted Text | `gray-400` |
| Font | Inter (Google Fonts) |

- Use **`.glass-panel`** CSS class or the **`<GlassCard>`** wrapper component for standard cards.
- Use the **`cn()`** utility for conditional class merging.
- Always prefer components from `frontend/src/components/ui/` before building new ones.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/timetable/check-conflicts` | Check for scheduling conflicts |

> Full interactive docs at **`http://localhost:8000/docs`** when the backend is running.

---

## 🔒 Environment Variables Reference

### `frontend/.env.local`
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for browser) |

### `backend/.env`
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** service-role key (server-side only) |

> ⚠️ **Never commit `.env` files.** They are excluded by `.gitignore`.

---

## 📁 Key Files for AI Assistants

If you are an AI assistant working on this project, read **[`LLM-Context.md`](./LLM-Context.md)** first. It contains:
- Implemented vs. pending features
- Design system conventions
- Data-access patterns and architectural decisions

---

## 📄 License

This project is private. All rights reserved.
