-- 0005_user_locale.sql
-- Adds locale preference column to users.

ALTER TABLE public.users
  ADD COLUMN locale text NOT NULL DEFAULT 'pt-BR';
