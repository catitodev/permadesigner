-- 0004_navigation_mode.sql
-- Adds navigation_mode column to projects for Student/Designer mode selection.

ALTER TABLE public.projects
  ADD COLUMN navigation_mode text NOT NULL DEFAULT 'student'
  CHECK (navigation_mode IN ('student', 'designer'));
