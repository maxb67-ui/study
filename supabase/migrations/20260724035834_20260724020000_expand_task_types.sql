/*
# Expand Task Types

## Overview
Expands the `type` CHECK constraint on the `tasks` table to support
homework, projects, and quizzes in addition to the existing assignment,
exam, and deadline types.

## Modified Tables
1. `tasks` — `type` constraint updated to allow: 'homework', 'assignment',
   'project', 'quiz', 'exam', 'deadline'

## Notes
1. The CHECK constraint is dropped and recreated — no data is touched.
2. Existing rows with 'assignment', 'exam', or 'deadline' remain valid.
3. RLS policies are unchanged — they already cover all CRUD verbs.
*/

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_type_check CHECK (type IN ('homework', 'assignment', 'project', 'quiz', 'exam', 'deadline'));
