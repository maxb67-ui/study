-- Create user_academic_goals table for private academic target storage
CREATE TABLE IF NOT EXISTS public.user_academic_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal_minutes INT DEFAULT 120,
  weekly_goal_hours INT DEFAULT 14,
  target_gpa NUMERIC(3,2) DEFAULT 3.8,
  target_completion_rate INT DEFAULT 90,
  target_exam_prep_sessions INT DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_academic_goals
ALTER TABLE public.user_academic_goals ENABLE ROW LEVEL SECURITY;

-- Owner-only RLS policies verifying auth.uid() = user_id for all CRUD operations
CREATE POLICY "Users can view own academic goals"
  ON public.user_academic_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own academic goals"
  ON public.user_academic_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own academic goals"
  ON public.user_academic_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own academic goals"
  ON public.user_academic_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enforce strict RLS on all existing user tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;