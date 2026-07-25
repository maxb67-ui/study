import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder.supabase.co');

const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type UserAcademicGoals = {
  user_id: string;
  daily_goal_minutes: number;
  weekly_goal_hours: number;
  target_gpa: number;
  target_completion_rate: number;
  target_exam_prep_sessions: number;
  updated_at: string;
};

export type Course = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  teacher: string | null;
  schedule: string | null;
  grading_weights: Record<string, number> | null;
  syllabus_url: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  type: 'homework' | 'assignment' | 'project' | 'quiz' | 'exam' | 'deadline';
  subject: string;
  difficulty: number;
  priority: number;
  due_date: string;
  estimated_hours: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type StudyBlock = {
  id: string;
  user_id: string;
  task_id: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  completed: boolean;
  created_at: string;
};

export type StudyLog = {
  id: string;
  user_id: string;
  task_id: string | null;
  date: string;
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

export type NoteInput = Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type CourseInput = Omit<Course, 'id' | 'user_id' | 'created_at'>;