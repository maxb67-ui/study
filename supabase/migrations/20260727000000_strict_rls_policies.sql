-- Ensure RLS is enabled on all core tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;

-- Re-create strict RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-create strict RLS policies for tasks
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Re-create strict RLS policies for courses
DROP POLICY IF EXISTS "Users can manage own courses" ON courses;
CREATE POLICY "Users can manage own courses" ON courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Re-create strict RLS policies for study_blocks
DROP POLICY IF EXISTS "Users can manage own study_blocks" ON study_blocks;
CREATE POLICY "Users can manage own study_blocks" ON study_blocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Re-create strict RLS policies for study_logs
DROP POLICY IF EXISTS "Users can manage own study_logs" ON study_logs;
CREATE POLICY "Users can manage own study_logs" ON study_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Re-create strict RLS policies for notes
DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Re-create strict RLS policies for settings
DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
CREATE POLICY "Users can manage own settings" ON settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);