# CampusFlow - LLM Context

This file serves as the definitive context map for any LLM working on the CampusFlow project. **Read this file first before making changes or proposing new features.**

## 1. General Instructions
- **Stack:** Next.js 14 App Router (React/TypeScript) for Frontend, FastAPI (Python) for Backend heavy-lifting, Supabase (PostgreSQL) for Database & Auth.
- **Data Access:** Simple CRUD should be done directly via `@supabase/ssr` (or JS client) in Next.js Server Actions or Client hooks. Complex DB operations (like scheduling conflicts) or AI processing (like OCR) should be routed to the FastAPI backend.
- **Design System First:** Always use the existing components in `frontend/src/components/ui/` before building new ones. All components should use the custom glassmorphism tokens.
- **Styling Method:** Use TailwindCSS along with the custom classes defined in `globals.css`. Use `cn()` utility for class merging.

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
- **Database Schema:** Fully initialized with `profiles`, `students`, `teachers`, `classrooms`, `classes`, `terms`, and `timetable_slots`. RLS policies are active.
- **Conflict Constraints:** Uses PostgreSQL `EXCLUDE USING gist` with `int4range` for detecting overlapping class times of variable durations at the DB level.
- **Auth System:** Next.js Middleware with `@supabase/ssr`. Role-based routing (Student, Teacher, Admin). Custom `AuthLayout`, `Login`, and `Register` pages.
- **Dashboard Layout:** A central dynamic `DashboardLayout` component that adjusts its sidebar based on the logged-in role.
- **Timetable Core UI:** A custom-built, absolute-positioned `<TimetableGrid />` component that accurately renders variable-length time slots visually.
- **FastAPI Timetable Router:** Programmatic conflict-checking endpoint for timetable slots.
- **Admin CRUD:** Basic Next.js frontend pages for managing Students, Teachers, Classes, and Classrooms (`/admin/students`, etc.) using a reusable `<DataTable />` and `<Modal />`.
- **Placeholders:** Created UI shells for Virtual Classroom, OCR Engine, and Interactive Campus Map.

## 4. Features Remaining (Pending Implementation)
- **Data Lookups:** "Free Room Finder" and "Teacher Availability" interfaces.
- **Timetable Integrations:** Hooking up the frontend `TimetableGrid` to the FastAPI backend / Supabase to load real slots dynamically.
- **Admin Integrations:** The "Add Student" and "Add Teacher" modals currently have UI logic but need secure backend (Admin API) hookups.
- **Final Polish:** Empty states, loading skeletons, responsive QA on mobile devices, Toast notifications for actions.

## 5. Extra Features (Vision / Future Enhancements)
- **OCR Intelligence:** Automatically converting uploaded images/PDFs of timetables into DB records.
- **Interactive 3D Campus Map:** Showing live room occupancy based on the current timetable time.
- **Virtual Classroom:** Simple assignment, announcement, and grading portal.

## 6. How to Update this LLM-Context
If you are an AI assistant and you have successfully implemented a new feature, modified the architecture, or altered the UI theme:
1. Open `LLM-Context.md`.
2. Move the completed feature from "Features Remaining" to "Features Implemented Till Now".
3. Add any new design tokens or UI paradigms to the "UI Theme & Consistency" section.
4. If a new dependency, table, or architectural pattern is introduced, note it under "General Instructions".
5. Keep descriptions concise and bulleted.
