-- Enable btree_gist extension for EXCLUDE constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Helper function: convert TIME to minutes since midnight (for range overlap checks)
CREATE OR REPLACE FUNCTION time_to_minutes(t TIME) RETURNS INT AS $$
  SELECT EXTRACT(HOUR FROM t)::INT * 60 + EXTRACT(MINUTE FROM t)::INT;
$$ LANGUAGE sql IMMUTABLE STRICT;

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teachers
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    department TEXT,
    designation TEXT,
    qualifications TEXT[],
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE NOT NULL,
    semester INT,
    division TEXT,
    year INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name TEXT NOT NULL,
    subject_code TEXT UNIQUE NOT NULL,
    credits INT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Terms (Academic terms like Fall 2024)
CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id UUID REFERENCES teachers(id) ON DELETE RESTRICT,
    term_id UUID REFERENCES terms(id) ON DELETE RESTRICT,
    semester INT,
    division TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Student Classes (Enrollment)
CREATE TABLE student_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, class_id)
);

-- 8. Classrooms
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT UNIQUE NOT NULL,
    building TEXT,
    floor INT,
    capacity INT,
    room_type TEXT CHECK (room_type IN ('lecture', 'lab', 'seminar', 'auditorium')),
    coordinates JSONB,
    amenities TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Timetable Slots
CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE RESTRICT,
    teacher_id UUID REFERENCES teachers(id) ON DELETE RESTRICT, -- denormalized for constraint
    term_id UUID REFERENCES terms(id) ON DELETE RESTRICT, -- denormalized for constraint
    day TEXT NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_classroom_overlap EXCLUDE USING gist (
        classroom_id WITH =,
        term_id WITH =,
        day WITH =,
        int4range(time_to_minutes(start_time), time_to_minutes(end_time)) WITH &&
    ),
    CONSTRAINT no_teacher_overlap EXCLUDE USING gist (
        teacher_id WITH =,
        term_id WITH =,
        day WITH =,
        int4range(time_to_minutes(start_time), time_to_minutes(end_time)) WITH &&
    ),
    CONSTRAINT start_before_end CHECK (start_time < end_time)
);

-- 10. Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    max_marks INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Marks
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own profile. Admins can CRUD all. 
CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (auth_role() = 'admin');
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (auth_role() = 'admin');
CREATE POLICY "Admins can insert all profiles" ON profiles FOR INSERT WITH CHECK (auth_role() = 'admin');
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teachers policies
CREATE POLICY "Teachers can view own" ON teachers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Teachers can update own bio" ON teachers FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Everyone can view teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Admins can manage teachers" ON teachers FOR ALL USING (auth_role() = 'admin');

-- Students policies
CREATE POLICY "Students can view own" ON students FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Everyone can view students" ON students FOR SELECT USING (true);
CREATE POLICY "Admins can manage students" ON students FOR ALL USING (auth_role() = 'admin');

-- Subjects & Terms policies
CREATE POLICY "Everyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL USING (auth_role() = 'admin');

CREATE POLICY "Everyone can view terms" ON terms FOR SELECT USING (true);
CREATE POLICY "Admins can manage terms" ON terms FOR ALL USING (auth_role() = 'admin');

-- Classes & Student Classes policies
CREATE POLICY "Everyone can view classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING (auth_role() = 'admin');

CREATE POLICY "Everyone can view student enrollments" ON student_classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage student enrollments" ON student_classes FOR ALL USING (auth_role() = 'admin');

-- Classrooms policies
CREATE POLICY "Everyone can view classrooms" ON classrooms FOR SELECT USING (true);
CREATE POLICY "Admins can manage classrooms" ON classrooms FOR ALL USING (auth_role() = 'admin');

-- Timetable Slots policies
CREATE POLICY "Everyone can view timetable slots" ON timetable_slots FOR SELECT USING (true);
CREATE POLICY "Teachers can insert/update own slots" ON timetable_slots FOR ALL USING (teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid()));
CREATE POLICY "Admins can manage timetable slots" ON timetable_slots FOR ALL USING (auth_role() = 'admin');

-- Announcements, Assignments, Marks
CREATE POLICY "Students can view announcements for enrolled classes" ON announcements FOR SELECT USING (
  class_id IN (SELECT class_id FROM student_classes WHERE student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()))
);
CREATE POLICY "Teachers can manage announcements" ON announcements FOR ALL USING (
  teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (auth_role() = 'admin');

CREATE POLICY "Students can view assignments for enrolled classes" ON assignments FOR SELECT USING (
  class_id IN (SELECT class_id FROM student_classes WHERE student_id IN (SELECT id FROM students WHERE profile_id = auth.uid()))
);
CREATE POLICY "Teachers can manage assignments" ON assignments FOR ALL USING (
  teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
);
CREATE POLICY "Admins can manage assignments" ON assignments FOR ALL USING (auth_role() = 'admin');

CREATE POLICY "Students can view own marks" ON marks FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
);
CREATE POLICY "Teachers can manage marks" ON marks FOR ALL USING (
  assignment_id IN (SELECT id FROM assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid()))
);
CREATE POLICY "Admins can manage marks" ON marks FOR ALL USING (auth_role() = 'admin');
