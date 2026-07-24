import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});

export type Task = {
  id: string;
  user_id: string;
  title: string;
  type: 'homework' | 'assignment' | 'project' | 'quiz' | 'exam' | 'deadline';
  subject: string;
  difficulty: number; // 1-5
  priority: number; // 1-5
  due_date: string;
  estimated_hours: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
};

export type StudyBlock = {
  id: string;
  user_id: string;
  task_id: string;
  scheduled_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  duration_minutes: number;
  completed: boolean;
  created_at: string;
};

export type StudyLog = {
  id: string;
  user_id: string;
  task_id: string | null;
  date: string; // YYYY-MM-DD
  minutes_studied: number;
  pomodoro_count: number;
  created_at: string;
};

export type Settings = {
  id: string;
  user_id: string;
  dark_mode: boolean;
  daily_goal_minutes: number;
  study_start_time: string;
  study_end_time: string;
  break_duration_minutes: number;
  pomodoro_length_minutes: number;
  reminders_enabled: boolean;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  grade_level: string | null;
  school_name: string | null;
  classes: string[];
  avatar_url: string | null;
  learning_style: string | null;
  study_goals: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'completed'> & {
  completed?: boolean;
};