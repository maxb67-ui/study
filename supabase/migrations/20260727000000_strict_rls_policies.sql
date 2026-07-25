-- Enable RLS on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Courses: Strict owner access
CREATE POLICY "Users can manage own courses" ON courses
  FOR ALL USING (auth.uid() = user_id);

-- Tasks: Strict owner access
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Notes: Strict owner access
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Study Blocks: Strict owner access
CREATE POLICY "Users can manage own blocks" ON study_blocks
  FOR ALL USING (auth.uid() = user_id);

-- Study Logs: Strict owner access
CREATE POLICY "Users can manage own logs" ON study_logs
  FOR ALL USING (auth.uid() = user_id);

-- Settings: Strict owner access
CREATE POLICY "Users can manage own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);