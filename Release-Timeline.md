# CampusFlow - Release Timeline

This document outlines the end-to-end release strategy for completing CampusFlow by the end of the week.

## Release 1: Core Foundation & Timetable Integration (Target: Today)
*Our first major goal is to connect all the existing UI pieces together to make the core app functional, focusing on the timetable and admin administration.*

**Key Objectives:**
- **Admin Integrations:** Implement secure backend hookups for the "Add Student" and "Add Teacher" modals. This will involve using the Supabase Service Role key (either via Next.js Server Actions or FastAPI) to securely bypass RLS and create user identities.
- **Timetable Integrations:** Connect the `<TimetableGrid />` component to dynamically load real slots from Supabase, filtered by the active term and the logged-in user's role (Student/Teacher classes).
- **Conflict Resolution UI:** Hook up the FastAPI `/timetable/check-conflicts` endpoint to the frontend so that when admins/teachers add new classes or slots, it prevents double-booking.
- **Data Lookups:** Build the interfaces for the "Free Room Finder" and "Teacher Availability" features to allow quick querying of the timetable data.

## Release 2: Virtual Classroom & UI Polish (Target: Tomorrow)
*With the timetable running, we'll build the academic interaction hub and refine the user experience.*

**Key Objectives:**
- **Virtual Classroom Portal:** Replace the placeholder UI with actual functional pages.
  - **Announcements:** Teachers can post announcements; students can read them.
  - **Assignments:** Teachers can create assignments with due dates; students can view them.
  - **Grading/Marks:** Teachers can grade assignments and provide feedback; students can see their marks.
- **Final Polish:** 
  - Implement Toast notifications for successful/failed actions (e.g., adding a student, saving a slot).
  - Add empty states (e.g., "No classes scheduled today") and loading skeletons for data fetching.
  - Perform responsive QA to ensure the app works seamlessly on mobile devices.

## Release 3: OCR Intelligence Integration (Target: Thursday)
*Introducing AI capabilities to automatically ingest legacy schedules.*

**Key Objectives:**
- **Backend OCR Engine:** Set up the OCR engine (e.g., using Tesseract, EasyOCR, or a vision model) within the FastAPI backend.
- **Upload Endpoint:** Create an endpoint to accept images/PDFs of timetables.
- **Data Parsing & DB Creation:** Process the extracted text and automatically generate `classes` and `timetable_slots` records.
- **Frontend Review UI:** Build a frontend interface where admins can upload files and review the parsed data for accuracy before committing it to the database.

## Release 4: Interactive 3D Campus Map (Target: Friday)
*Adding the premium, dynamic visualization layer.*

**Key Objectives:**
- **Map Component:** Integrate a 3D or interactive 2D map component of the campus (e.g., using React Three Fiber or a suitable mapping library).
- **Live Occupancy:** Link the map to the current time and the `timetable_slots` data.
- **Visual Indicators:** Visually indicate which classrooms are currently "Occupied" vs "Free" on the map.
- **Room Details:** Allow users to click on a room to see what class is currently running and when it will end.

## Release 5: End-to-End Testing & Deployment (Target: Weekend)
*Final wrap-up, testing, and pushing the platform live.*

**Key Objectives:**
- **Comprehensive QA:** Perform end-to-end testing across all three roles (Student, Teacher, Admin) to ensure RLS policies and UI flows are flawless.
- **Performance Optimization:** Optimize queries and component renders.
- **Deployment:**
  - Deploy the Next.js frontend (e.g., to Vercel).
  - Deploy the FastAPI backend (e.g., to Render, Railway, or AWS).
  - Configure production environment variables and CORS.
- **Launch:** Final project delivery.
