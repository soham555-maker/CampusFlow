-- ==========================================================================
-- CampusFlow — Database Schema
-- ==========================================================================
-- Identity model: there is NO `profiles` table. Each role is its own table
-- (`students`, `teachers`, `admins`), and each links to auth.users via a
-- nullable `user_id` (so admins can pre-create roster rows before a person
-- signs up). A `handle_new_user` trigger auto-creates the student/teacher row
-- on signup; admins are provisioned manually. Run this whole file in the
-- Supabase SQL Editor to provision a fresh project.
-- ==========================================================================

-- btree_gist is required for the EXCLUDE constraints on timetable_slots.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- --------------------------------------------------------------------------
-- Helper functions (no table dependencies)
-- --------------------------------------------------------------------------

-- Convert TIME to minutes since midnight (used by the overlap EXCLUDE checks).
CREATE OR REPLACE FUNCTION public.time_to_minutes(t time without time zone)
RETURNS integer
LANGUAGE sql
IMMUTABLE STRICT
SET search_path = ''
AS $$
  SELECT EXTRACT(HOUR FROM t)::int * 60 + EXTRACT(MINUTE FROM t)::int;
$$;

-- Generic BEFORE UPDATE trigger that maintains updated_at.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- --------------------------------------------------------------------------
-- Role / identity tables
-- --------------------------------------------------------------------------

-- 1. Students
CREATE TABLE public.students (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name   text NOT NULL,
    email       text NOT NULL,
    phone       text,
    avatar_url  text,
    roll_number text UNIQUE,          -- nullable: self-signups have none until an admin assigns one
    semester    int,
    division    text,
    year        int,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Teachers
CREATE TABLE public.teachers (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name      text NOT NULL,
    email          text NOT NULL,
    phone          text,
    avatar_url     text,
    department     text,
    designation    text,
    qualifications text[],
    bio            text,
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. Admins (provisioned manually; never created via public signup)
CREATE TABLE public.admins (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name  text NOT NULL,
    email      text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- Academic catalogue
-- --------------------------------------------------------------------------

-- 4. Subjects
CREATE TABLE public.subjects (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name text NOT NULL,
    subject_code text UNIQUE NOT NULL,
    credits      int,
    description  text,
    created_at   timestamptz DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 5. Terms (e.g. Fall 2024)
CREATE TABLE public.terms (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL UNIQUE,
    start_date date,
    end_date   date,
    is_active  boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Classes (a section: subject + teacher + term + division)
CREATE TABLE public.classes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
    term_id    uuid NOT NULL REFERENCES public.terms(id)    ON DELETE RESTRICT,
    semester   int,
    division   text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT classes_subject_term_division_key UNIQUE (subject_id, term_id, division)
);

-- 7. Student enrolment
CREATE TABLE public.student_classes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id    uuid NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
    enrolled_at timestamptz DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (student_id, class_id)
);

-- 8. Classrooms
CREATE TABLE public.classrooms (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number text UNIQUE NOT NULL,
    building    text,
    floor       int,
    capacity    int,
    room_type   text CHECK (room_type IN ('lecture', 'lab', 'seminar', 'auditorium')),
    coordinates jsonb,
    amenities   text[],
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 9. Timetable slots.
-- teacher_id / term_id are denormalized (required by the EXCLUDE constraints)
-- and are kept in sync with the parent class by trg_sync_slot_from_class.
CREATE TABLE public.timetable_slots (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id     uuid NOT NULL REFERENCES public.classes(id)    ON DELETE CASCADE,
    classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE RESTRICT,
    teacher_id   uuid NOT NULL REFERENCES public.teachers(id)   ON DELETE RESTRICT,
    term_id      uuid NOT NULL REFERENCES public.terms(id)      ON DELETE RESTRICT,
    day          text NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
    start_time   time NOT NULL,
    end_time     time NOT NULL,
    created_at   timestamptz DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT no_classroom_overlap EXCLUDE USING gist (
        classroom_id WITH =,
        term_id WITH =,
        day WITH =,
        int4range(public.time_to_minutes(start_time), public.time_to_minutes(end_time)) WITH &&
    ),
    CONSTRAINT no_teacher_overlap EXCLUDE USING gist (
        teacher_id WITH =,
        term_id WITH =,
        day WITH =,
        int4range(public.time_to_minutes(start_time), public.time_to_minutes(end_time)) WITH &&
    ),
    CONSTRAINT start_before_end CHECK (start_time < end_time)
);

-- 10. Announcements
CREATE TABLE public.announcements (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id   uuid NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    title      text NOT NULL,
    body       text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Assignments
CREATE TABLE public.assignments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id    uuid NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
    teacher_id  uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    title       text NOT NULL,
    description text,
    due_date    timestamptz,
    max_marks   int,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 12. Marks (one row per assignment+student)
CREATE TABLE public.marks (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id  uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id     uuid NOT NULL REFERENCES public.students(id)    ON DELETE CASCADE,
    marks_obtained numeric,
    feedback       text,
    submitted_at   timestamptz DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT marks_assignment_student_key UNIQUE (assignment_id, student_id)
);

-- --------------------------------------------------------------------------
-- Functions that depend on the tables above
-- --------------------------------------------------------------------------

-- Resolve the calling user's role from the three role tables.
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.admins   a WHERE a.user_id = (SELECT auth.uid())) THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.teachers t WHERE t.user_id = (SELECT auth.uid())) THEN 'teacher'
    WHEN EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = (SELECT auth.uid())) THEN 'student'
    ELSE NULL
  END;
$$;
REVOKE EXECUTE ON FUNCTION public.auth_role() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.auth_role() TO authenticated;

-- Keep timetable_slots.teacher_id / term_id consistent with the parent class.
CREATE OR REPLACE FUNCTION public.sync_slot_from_class()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  SELECT c.teacher_id, c.term_id
    INTO NEW.teacher_id, NEW.term_id
  FROM public.classes c
  WHERE c.id = NEW.class_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'timetable_slots.class_id % does not reference an existing class', NEW.class_id;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_slot_from_class() FROM anon, authenticated, public;

-- Auto-create the student/teacher row on signup (admins are never auto-created).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := NEW.raw_user_meta_data ->> 'role';
  v_name text := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
BEGIN
  IF v_role = 'teacher' THEN
    INSERT INTO public.teachers (user_id, full_name, email)
    VALUES (NEW.id, v_name, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.students (user_id, full_name, email)
    VALUES (NEW.id, v_name, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- --------------------------------------------------------------------------
-- Foreign-key indexes (FK columns not already covered by a unique/exclude index)
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_announcements_class_id       ON public.announcements (class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_id     ON public.announcements (teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id         ON public.assignments (class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id       ON public.assignments (teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id           ON public.classes (teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_term_id              ON public.classes (term_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_id             ON public.marks (student_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_class_id     ON public.student_classes (class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id     ON public.timetable_slots (class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_classroom_id ON public.timetable_slots (classroom_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher_id   ON public.timetable_slots (teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_term_id      ON public.timetable_slots (term_id);

-- --------------------------------------------------------------------------
-- Triggers
-- --------------------------------------------------------------------------

-- updated_at maintenance on every table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'students','teachers','admins','subjects','terms','classes',
    'student_classes','classrooms','timetable_slots','announcements','assignments','marks'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t);
  END LOOP;
END $$;

-- timetable slot denormalization sync
DROP TRIGGER IF EXISTS trg_sync_slot_from_class ON public.timetable_slots;
CREATE TRIGGER trg_sync_slot_from_class
  BEFORE INSERT OR UPDATE OF class_id ON public.timetable_slots
  FOR EACH ROW EXECUTE FUNCTION public.sync_slot_from_class();

-- auto-provision role row on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================
ALTER TABLE public.students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks           ENABLE ROW LEVEL SECURITY;

-- Admins
CREATE POLICY "Admins manage admins" ON public.admins FOR ALL
  USING ((SELECT public.auth_role()) = 'admin')
  WITH CHECK ((SELECT public.auth_role()) = 'admin');
CREATE POLICY "Admins view own row" ON public.admins FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Students (public read; self-update; admin manage)
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Students update own row" ON public.students FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins manage students" ON public.students FOR ALL
  USING ((SELECT public.auth_role()) = 'admin')
  WITH CHECK ((SELECT public.auth_role()) = 'admin');

-- Teachers (public read; self-update; admin manage)
CREATE POLICY "Anyone can view teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Teachers update own row" ON public.teachers FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins manage teachers" ON public.teachers FOR ALL
  USING ((SELECT public.auth_role()) = 'admin')
  WITH CHECK ((SELECT public.auth_role()) = 'admin');

-- Reference data (public read, admin write)
CREATE POLICY "Anyone can view subjects"    ON public.subjects        FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects"      ON public.subjects        FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');
CREATE POLICY "Anyone can view terms"       ON public.terms           FOR SELECT USING (true);
CREATE POLICY "Admins manage terms"         ON public.terms           FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');
CREATE POLICY "Anyone can view classrooms"  ON public.classrooms      FOR SELECT USING (true);
CREATE POLICY "Admins manage classrooms"    ON public.classrooms      FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');
CREATE POLICY "Anyone can view classes"     ON public.classes         FOR SELECT USING (true);
CREATE POLICY "Admins manage classes"       ON public.classes         FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');
CREATE POLICY "Anyone can view enrollments" ON public.student_classes FOR SELECT USING (true);
CREATE POLICY "Admins manage enrollments"   ON public.student_classes FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');

-- Timetable slots (public read; teacher-own + admin write)
CREATE POLICY "Anyone can view timetable slots" ON public.timetable_slots FOR SELECT USING (true);
CREATE POLICY "Admins manage timetable slots"   ON public.timetable_slots FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');
CREATE POLICY "Teachers manage own slots" ON public.timetable_slots FOR ALL
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid())));

-- Announcements (enrolled students read; teacher-own + admin write)
CREATE POLICY "Students view announcements for enrolled classes" ON public.announcements FOR SELECT
  USING (class_id IN (
    SELECT sc.class_id FROM public.student_classes sc
    JOIN public.students s ON s.id = sc.student_id
    WHERE s.user_id = (SELECT auth.uid())));
CREATE POLICY "Teachers manage own announcements" ON public.announcements FOR ALL
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');

-- Assignments (enrolled students read; teacher-own + admin write)
CREATE POLICY "Students view assignments for enrolled classes" ON public.assignments FOR SELECT
  USING (class_id IN (
    SELECT sc.class_id FROM public.student_classes sc
    JOIN public.students s ON s.id = sc.student_id
    WHERE s.user_id = (SELECT auth.uid())));
CREATE POLICY "Teachers manage own assignments" ON public.assignments FOR ALL
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Admins manage assignments" ON public.assignments FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');

-- Marks (student sees own; teacher grades own assignments; admin all)
CREATE POLICY "Students view own marks" ON public.marks FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Teachers manage marks for own assignments" ON public.marks FOR ALL
  USING (assignment_id IN (
    SELECT a.id FROM public.assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = (SELECT auth.uid())))
  WITH CHECK (assignment_id IN (
    SELECT a.id FROM public.assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = (SELECT auth.uid())));
CREATE POLICY "Admins manage marks" ON public.marks FOR ALL
  USING ((SELECT public.auth_role()) = 'admin') WITH CHECK ((SELECT public.auth_role()) = 'admin');
