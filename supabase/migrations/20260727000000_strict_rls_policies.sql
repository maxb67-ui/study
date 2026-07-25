-- Ensure Row Level Security is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Clean up any legacy loose policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can read own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can read own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can read own study blocks" ON public.study_blocks;
DROP POLICY IF EXISTS "Users can insert own study blocks" ON public.study_blocks;
DROP POLICY IF EXISTS "Users can update own study blocks" ON public.study_blocks;
DROP POLICY IF EXISTS "Users can delete own study blocks" ON public.study_blocks;
DROP POLICY IF EXISTS "Users can read own study logs" ON public.study_logs;
DROP POLICY IF EXISTS "Users can insert own study logs" ON public.study_logs;
DROP POLICY IF EXISTS "Users can update own study logs" ON public.study_logs;
DROP POLICY IF EXISTS "Users can delete own study logs" ON public.study_logs;
DROP POLICY IF EXISTS "Users can read own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;

-- PROFILES Policies
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- COURSES Policies
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "courses_insert_policy" ON public.courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "courses_update_policy" ON public.courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "courses_delete_policy" ON public.courses
  FOR DELETE USING (auth.uid() = user_id);

-- TASKS Policies
CREATE POLICY "tasks_select_policy" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_policy" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_policy" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete_policy" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- NOTES Policies
CREATE POLICY "notes_select_policy" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert_policy" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update_policy" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notes_delete_policy" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- STUDY BLOCKS Policies
CREATE POLICY "study_blocks_select_policy" ON public.study_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "study_blocks_insert_policy" ON public.study_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_blocks_update_policy" ON public.study_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "study_blocks_delete_policy" ON public.study_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- STUDY LOGS Policies
CREATE POLICY "study_logs_select_policy" ON public.study_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "study_logs_insert_policy" ON public.study_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_logs_update_policy" ON public.study_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "study_logs_delete_policy" ON public.study_logs
  FOR DELETE USING (auth.uid() = user_id);

-- SETTINGS Policies
CREATE POLICY "settings_select_policy" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "settings_insert_policy" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update_policy" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);