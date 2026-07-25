-- Enable Row Level Security (RLS) on all application tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_logs ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies to ensure clean re-creation
DO $$
BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  -- Settings
  DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
  DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
  DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;

  -- Tasks
  DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
  DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

  -- Courses
  DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
  DROP POLICY IF EXISTS "Users can insert own courses" ON public.courses;
  DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
  DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;

  -- Notes
  DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
  DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
  DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
  DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

  -- Study Blocks
  DROP POLICY IF EXISTS "Users can view own study_blocks" ON public.study_blocks;
  DROP POLICY IF EXISTS "Users can insert own study_blocks" ON public.study_blocks;
  DROP POLICY IF EXISTS "Users can update own study_blocks" ON public.study_blocks;
  DROP POLICY IF EXISTS "Users can delete own study_blocks" ON public.study_blocks;

  -- Study Logs
  DROP POLICY IF EXISTS "Users can view own study_logs" ON public.study_logs;
  DROP POLICY IF EXISTS "Users can insert own study_logs" ON public.study_logs;
  DROP POLICY IF EXISTS "Users can update own study_logs" ON public.study_logs;
  DROP POLICY IF EXISTS "Users can delete own study_logs" ON public.study_logs;
END $$;

-- 1. Profiles (id = auth.uid())
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Settings (user_id = auth.uid())
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Tasks
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- 4. Courses
CREATE POLICY "Users can view own courses" ON public.courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = user_id);

-- 5. Notes
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- 6. Study Blocks
CREATE POLICY "Users can view own study_blocks" ON public.study_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study_blocks" ON public.study_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study_blocks" ON public.study_blocks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own study_blocks" ON public.study_blocks FOR DELETE USING (auth.uid() = user_id);

-- 7. Study Logs
CREATE POLICY "Users can view own study_logs" ON public.study_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study_logs" ON public.study_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study_logs" ON public.study_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own study_logs" ON public.study_logs FOR DELETE USING (auth.uid() = user_id);