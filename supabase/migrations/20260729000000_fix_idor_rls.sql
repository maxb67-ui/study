-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing loose policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own blocks" ON study_blocks;
DROP POLICY IF EXISTS "Users can manage own logs" ON study_logs;
DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
DROP POLICY IF EXISTS "Users can manage own courses" ON courses;

-- 3. Create strict policies linked to auth.uid()
CREATE POLICY "Strict user profile access" ON profiles 
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Strict settings access" ON settings 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strict tasks access" ON tasks 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strict study blocks access" ON study_blocks 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strict study logs access" ON study_logs 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strict notes access" ON notes 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strict courses access" ON courses 
    FOR ALL USING (auth.uid() = user_id);