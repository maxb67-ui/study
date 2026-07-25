-- Reinforce RLS on all critical study planner tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- Tasks Policies
CREATE POLICY "Users can only access their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- Notes Policies
CREATE POLICY "Users can only access their own notes" ON notes
    FOR ALL USING (auth.uid() = user_id);

-- Courses Policies
CREATE POLICY "Users can only access their own courses" ON courses
    FOR ALL USING (auth.uid() = user_id);

-- Study Blocks Policies
CREATE POLICY "Users can only access their own study blocks" ON study_blocks
    FOR ALL USING (auth.uid() = user_id);

-- Study Logs Policies
CREATE POLICY "Users can only access their own study logs" ON study_logs
    FOR ALL USING (auth.uid() = user_id);

-- Profiles Policies
CREATE POLICY "Users can view and update their own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Settings Policies
CREATE POLICY "Users can manage their own settings" ON settings
    FOR ALL USING (auth.uid() = user_id);