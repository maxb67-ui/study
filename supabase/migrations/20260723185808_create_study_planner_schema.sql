/*
# Study Planner — Core Schema

## Overview
Creates the data model for a student productivity app. Single-tenant (no auth):
the anon-key frontend owns all rows, so policies are scoped to `anon, authenticated`.

## New Tables

1. `tasks` — assignments, exams, and deadlines the student enters.
   - `id` uuid PK
   - `title` text NOT NULL
   - `type` text NOT NULL — one of 'assignment', 'exam', 'deadline'
   - `subject` text NOT NULL
   - `difficulty` int2 NOT NULL — 1 (easy) to 5 (hard)
   - `priority` int2 NOT NULL DEFAULT 3 — 1 (low) to 5 (urgent)
   - `due_date` timestamptz NOT NULL
   - `estimated_hours` numeric(5,1) NOT NULL DEFAULT 2 — total study time needed
   - `completed` boolean NOT NULL DEFAULT false
   - `notes` text
   - `created_at` timestamptz DEFAULT now()

2. `study_blocks` — AI-generated study schedule slots tied to a task.
   - `id` uuid PK
   - `task_id` uuid FK -> tasks(id) ON DELETE CASCADE
   - `scheduled_date` date NOT NULL
   - `start_time` time NOT NULL
   - `duration_minutes` int NOT NULL
   - `completed` boolean NOT NULL DEFAULT false
   - `created_at` timestamptz DEFAULT now()

3. `study_logs` — Pomodoro sessions and study streak data.
   - `id` uuid PK
   - `task_id` uuid FK -> tasks(id) ON DELETE SET NULL (nullable)
   - `date` date NOT NULL
   - `minutes_studied` int NOT NULL DEFAULT 0
   - `pomodoro_count` int NOT NULL DEFAULT 0
   - `created_at` timestamptz DEFAULT now()

4. `settings` — single-row table for app preferences.
   - `id` int PK (always 1)
   - `dark_mode` boolean NOT NULL DEFAULT false
   - `daily_goal_minutes` int NOT NULL DEFAULT 120
   - `study_start_time` time NOT NULL DEFAULT '08:00'
   - `study_end_time` time NOT NULL DEFAULT '22:00'
   - `break_duration_minutes` int NOT NULL DEFAULT 5
   - `pomodoro_length_minutes` int NOT NULL DEFAULT 25
   - `reminders_enabled` boolean NOT NULL DEFAULT true
   - `updated_at` timestamptz DEFAULT now()

## Security
- RLS enabled on all tables.
- All policies `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is an intentionally single-tenant, no-auth app.

## Notes
1. `settings` is seeded with one row (id = 1) so the app always has a config to read.
2. Indexes added on date columns used for calendar/range queries.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('assignment', 'exam', 'deadline')),
  subject text NOT NULL,
  difficulty int2 NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  priority int2 NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  due_date timestamptz NOT NULL,
  estimated_hours numeric(5,1) NOT NULL DEFAULT 2,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes int NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  date date NOT NULL,
  minutes_studied int NOT NULL DEFAULT 0,
  pomodoro_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1,
  dark_mode boolean NOT NULL DEFAULT false,
  daily_goal_minutes int NOT NULL DEFAULT 120,
  study_start_time time NOT NULL DEFAULT '08:00',
  study_end_time time NOT NULL DEFAULT '22:00',
  break_duration_minutes int NOT NULL DEFAULT 5,
  pomodoro_length_minutes int NOT NULL DEFAULT 25,
  reminders_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Seed settings row
INSERT INTO settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks (completed);
CREATE INDEX IF NOT EXISTS idx_study_blocks_date ON study_blocks (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_study_blocks_task ON study_blocks (task_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_date ON study_logs (date);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- tasks policies
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- study_blocks policies
DROP POLICY IF EXISTS "anon_select_study_blocks" ON study_blocks;
CREATE POLICY "anon_select_study_blocks" ON study_blocks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_study_blocks" ON study_blocks;
CREATE POLICY "anon_insert_study_blocks" ON study_blocks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_study_blocks" ON study_blocks;
CREATE POLICY "anon_update_study_blocks" ON study_blocks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_study_blocks" ON study_blocks;
CREATE POLICY "anon_delete_study_blocks" ON study_blocks FOR DELETE
  TO anon, authenticated USING (true);

-- study_logs policies
DROP POLICY IF EXISTS "anon_select_study_logs" ON study_logs;
CREATE POLICY "anon_select_study_logs" ON study_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_study_logs" ON study_logs;
CREATE POLICY "anon_insert_study_logs" ON study_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_study_logs" ON study_logs;
CREATE POLICY "anon_update_study_logs" ON study_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_study_logs" ON study_logs;
CREATE POLICY "anon_delete_study_logs" ON study_logs FOR DELETE
  TO anon, authenticated USING (true);

-- settings policies
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);