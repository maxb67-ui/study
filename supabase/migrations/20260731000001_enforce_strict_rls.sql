-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts and ensure clean state
DO $$ 
BEGIN
    -- Tasks
    DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
    DROP POLICY IF EXISTS "User can update own tasks" ON tasks;
    
    -- Notes
    DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
    
    -- Academic Goals
    DROP POLICY IF EXISTS "Users can manage own academic goals" ON user_academic_goals;
    
    -- Courses
    DROP POLICY IF EXISTS "Users can manage own courses" ON courses;
    
    -- Study Blocks
    DROP POLICY IF EXISTS "Users can manage own study blocks" ON study_blocks;
    
    -- Settings
    DROP POLICY IF EXISTS "Users can manage own settings" ON settings;
    
    -- Study Logs
    DROP POLICY IF EXISTS "Users can manage own study logs" ON study_logs;
END $$;

-- Create Strict "auth.uid()" based policies for every table
-- TASKS
CREATE POLICY "Strict access to own tasks" ON tasks
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NOTES
CREATE POLICY "Strict access to own notes" ON notes
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ACADEMIC GOALS
CREATE POLICY "Strict access to own academic goals" ON user_academic_goals
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- COURSES
CREATE POLICY "Strict access to own courses" ON courses
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- STUDY BLOCKS
CREATE POLICY "Strict access to own study blocks" ON study_blocks
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- SETTINGS
CREATE POLICY "Strict access to own settings" ON settings
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- STUDY LOGS
CREATE POLICY "Strict access to own study logs" ON study_logs
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);