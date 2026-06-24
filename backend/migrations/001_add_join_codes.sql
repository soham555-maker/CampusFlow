-- Migration 001: Add join codes to classes and terms,
-- and add student self-enrollment RLS policies on student_classes.
-- Run this in the Supabase SQL Editor after the base schema.

-- Helper: generate a random alphanumeric string of a given length
CREATE OR REPLACE FUNCTION public.generate_join_code(length int DEFAULT 8)
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  SELECT upper(substring(md5(gen_random_uuid()::text) FROM 1 FOR length));
$$;

-- Add join_code to classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS join_code text UNIQUE DEFAULT public.generate_join_code(8);

-- Backfill any existing rows that got NULL (shouldn't happen with DEFAULT, but safety net)
UPDATE public.classes SET join_code = public.generate_join_code(8) WHERE join_code IS NULL;

-- Add join_code to terms
ALTER TABLE public.terms
  ADD COLUMN IF NOT EXISTS join_code text UNIQUE DEFAULT public.generate_join_code(6);

UPDATE public.terms SET join_code = public.generate_join_code(6) WHERE join_code IS NULL;

-- RLS: Students can self-enroll in a class (INSERT only their own student_id)
CREATE POLICY "Students can self-enroll" ON public.student_classes FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = (SELECT auth.uid())
    )
  );

-- RLS: Students can unenroll themselves (DELETE only their own rows)
CREATE POLICY "Students can unenroll self" ON public.student_classes FOR DELETE
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = (SELECT auth.uid())
    )
  );
