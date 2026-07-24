/*
# Add Authentication, User Profiles, and Multi-Tenant Data Isolation

## Overview
Converts the study planner from a single-tenant (no-auth) app to a multi-tenant
authenticated app. Each user has a private profile and can only access their own
tasks, study blocks, logs, and settings. Uses Supabase Auth (email/password) for
authentication and Row Level Security (RLS) for data isolation.

## New Tables

1. `profiles` — extended user information linked to auth.users.
   - `id` uuid PK, references auth.users(id) ON DELETE CASCADE
   - `full_name` text NOT NULL DEFAULT ''
   - `grade_level` text (e.g. "Freshman", "Sophomore", "AP", "Graduate")
   - `school_name` text
   - `classes` text[] DEFAULT '{}' — array of class/subject names
   - `avatar_url` text
   - `created_at` timestamptz DEFAULT now()
   - `updated_at` timestamptz DEFAULT now()

## Modified Tables

1. `tasks` — added `user_id uuid NOT NULL DEFAULT auth.uid()`.
2. `study_blocks` — added `user_id uuid NOT NULL DEFAULT auth.uid()`.
3. `study_logs` — added `user_id uuid NOT NULL DEFAULT auth.uid()`.
4. `settings` — added `user_id uuid NOT NULL DEFAULT auth.uid()`, changed PK
   from `id int` to `id uuid DEFAULT gen_random_uuid()`. Old seed row deleted
   since it has no owner.

## Security Changes (RLS)
- All old `anon, authenticated` / `USING (true)` policies DROPPED.
- Replaced with owner-scoped `TO authenticated` policies using `auth.uid() = user_id`.
- `profiles` table: RLS enabled, users can read/update only their own row.
- Trigger auto-creates profile + settings rows on signup.

## Important Notes
1. DEFAULT auth.uid() on user_id columns so frontend inserts work without passing user_id.
2. Email confirmation stays OFF — users can sign in immediately after signup.
3. handle_new_user trigger creates profile + settings rows on auth.users INSERT.
*/

-- ============================================================
-- 1. Add user_id columns (nullable first for existing data)
-- ============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE study_blocks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE study_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- 2. Clean up old single-tenant data (no owner, not accessible by any user)
-- ============================================================

DELETE FROM study_blocks;
DELETE FROM study_logs;
DELETE FROM tasks;
DELETE FROM settings;

-- ============================================================
-- 3. Make user_id NOT NULL with DEFAULT auth.uid()
-- ============================================================

ALTER TABLE tasks
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE study_blocks
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE study_logs
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE settings
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ============================================================
-- 4. Settings: change PK from int to uuid
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'settings' AND constraint_name = 'settings_pkey' AND table_schema = 'public'
  ) THEN
    ALTER TABLE settings DROP CONSTRAINT settings_pkey;
  END IF;
END $$;

-- Drop old int id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'id' AND data_type = 'integer'
  ) THEN
    ALTER TABLE settings DROP COLUMN id;
  END IF;
END $$;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid();

-- Unique: one settings row per user
CREATE UNIQUE INDEX IF NOT EXISTS settings_user_id_unique ON settings (user_id);

-- ============================================================
-- 5. Create profiles table
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  grade_level text,
  school_name text,
  classes text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_study_blocks_user_id ON study_blocks (user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_id ON study_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_study_blocks_user_date ON study_blocks (user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs (user_id, date);

-- ============================================================
-- 7. Drop all old anon policies
-- ============================================================

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;

DROP POLICY IF EXISTS "anon_select_study_blocks" ON study_blocks;
DROP POLICY IF EXISTS "anon_insert_study_blocks" ON study_blocks;
DROP POLICY IF EXISTS "anon_update_study_blocks" ON study_blocks;
DROP POLICY IF EXISTS "anon_delete_study_blocks" ON study_blocks;

DROP POLICY IF EXISTS "anon_select_study_logs" ON study_logs;
DROP POLICY IF EXISTS "anon_insert_study_logs" ON study_logs;
DROP POLICY IF EXISTS "anon_update_study_logs" ON study_logs;
DROP POLICY IF EXISTS "anon_delete_study_logs" ON study_logs;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
DROP POLICY IF EXISTS "anon_update_settings" ON settings;

-- ============================================================
-- 8. Enable RLS on profiles
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. Owner-scoped RLS policies (4 per table)
-- ============================================================

-- tasks
DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- study_blocks
DROP POLICY IF EXISTS "select_own_study_blocks" ON study_blocks;
CREATE POLICY "select_own_study_blocks" ON study_blocks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_blocks" ON study_blocks;
CREATE POLICY "insert_own_study_blocks" ON study_blocks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_blocks" ON study_blocks;
CREATE POLICY "update_own_study_blocks" ON study_blocks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_blocks" ON study_blocks;
CREATE POLICY "delete_own_study_blocks" ON study_blocks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- study_logs
DROP POLICY IF EXISTS "select_own_study_logs" ON study_logs;
CREATE POLICY "select_own_study_logs" ON study_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_logs" ON study_logs;
CREATE POLICY "insert_own_study_logs" ON study_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_logs" ON study_logs;
CREATE POLICY "update_own_study_logs" ON study_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_logs" ON study_logs;
CREATE POLICY "delete_own_study_logs" ON study_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- settings
DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- 10. Trigger: auto-create profile + settings on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 11. updated_at trigger for profiles
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
