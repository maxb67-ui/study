import type { Task, StudyLog, StudyBlock } from './supabase';
import { localDateISO, addDays } from './dates';

export type AcademicGoals = {
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
  targetGpa: number;
  targetCompletionRate: number; // 0-100%
  targetExamPrepSessions: number; // sessions per week
};

export type GoalProgress = {
  daily: { currentMinutes: number; targetMinutes: number; pct: number };
  weekly: { currentHours: number; targetHours: number; pct: number };
  completion: { currentRate: number; targetRate: number; pct: number };
  examPrep: { currentSessions: number; targetSessions: number; pct: number };
  estimatedGpa: number;
  gpaProgressPct: number;
};

export type GoalRecommendation = {
  id: string;
  title: string;
  advice: string;
  actionView: 'tasks' | 'calendar' | 'pomodoro' | 'tutor';
  metricTag: string;
};

const BASE_STORAGE_KEY = 'lumora_academic_goals_v1';

export const DEFAULT_GOALS: AcademicGoals = {
  dailyGoalMinutes: 120,
  weeklyGoalHours: 14,
  targetGpa: 3.8,
  targetCompletionRate: 90,
  targetExamPrepSessions: 5,
};

export function getAcademicGoals(userId: string): AcademicGoals {
  if (!userId) return DEFAULT_GOALS;
  try {
    const saved = localStorage.getItem(`${BASE_STORAGE_KEY}_${userId}`);
    if (saved) return { ...DEFAULT_GOALS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_GOALS;
}

export function saveAcademicGoals(userId: string, goals: AcademicGoals): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${BASE_STORAGE_KEY}_${userId}`, JSON.stringify(goals));
  } catch {}
}

export function calculateGoalProgress(
  goals: AcademicGoals,
  tasks: Task[],
  logs: StudyLog[],
  blocks: StudyBlock[],
): GoalProgress {
  const todayISO = localDateISO(new Date());

  // 1. Daily Progress
  const todayLogsMin = logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
  const todayBlocksMin = blocks.filter((b) => b.scheduled_date === todayISO && b.completed).reduce((s, b) => s + b.duration_minutes, 0);
  const currentDailyMin = Math.max(todayLogsMin, todayBlocksMin);
  const dailyPct = Math.min(100, Math.round((currentDailyMin / (goals.dailyGoalMinutes || 1)) * 100));

  // 2. Weekly Progress
  let currentWeeklyMin = 0;
  for (let i = 0; i < 7; i++) {
    const iso = localDateISO(addDays(new Date(), -i));
    const dayMin = logs.filter((l) => l.date === iso).reduce((s, l) => s + l.minutes_studied, 0);
    currentWeeklyMin += dayMin;
  }
  const currentWeeklyHours = Math.round((currentWeeklyMin / 60) * 10) / 10;
  const weeklyPct = Math.min(100, Math.round((currentWeeklyHours / (goals.weeklyGoalHours || 1)) * 100));

  // 3. Completion Rate
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const currentRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const completionPct = Math.min(100, Math.round((currentRate / (goals.targetCompletionRate || 1)) * 100));

  // 4. Exam Prep Sessions (this week)
  const examTaskIds = new Set(tasks.filter((t) => t.type === 'exam').map((t) => t.id));
  let examSessionsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const iso = localDateISO(addDays(new Date(), -i));
    const dayBlocks = blocks.filter((b) => b.scheduled_date === iso && examTaskIds.has(b.task_id));
    examSessionsThisWeek += dayBlocks.length;
  }
  const examPrepPct = Math.min(100, Math.round((examSessionsThisWeek / (goals.targetExamPrepSessions || 1)) * 100));

  // 5. GPA Estimate based on completion rate & study consistency
  const baseGpa = 2.5;
  const performanceBoost = (currentRate / 100) * 1.3 + (weeklyPct / 100) * 0.2;
  const estimatedGpa = Math.min(4.0, Math.round((baseGpa + performanceBoost) * 100) / 100);
  const gpaProgressPct = Math.min(100, Math.round((estimatedGpa / goals.targetGpa) * 100));

  return {
    daily: { currentMinutes: currentDailyMin, targetMinutes: goals.dailyGoalMinutes, pct: dailyPct },
    weekly: { currentHours: currentWeeklyHours, targetHours: goals.weeklyGoalHours, pct: weeklyPct },
    completion: { currentRate, targetRate: goals.targetCompletionRate, pct: completionPct },
    examPrep: { currentSessions: examSessionsThisWeek, targetSessions: goals.targetExamPrepSessions, pct: examPrepPct },
    estimatedGpa,
    gpaProgressPct,
  };
}

export function generateGoalAIRecommendations(
  goals: AcademicGoals,
  progress: GoalProgress,
  tasks: Task[],
): GoalRecommendation[] {
  const recs: GoalRecommendation[] = [];

  if (progress.weekly.pct < 60) {
    const neededHours = Math.round((goals.weeklyGoalHours - progress.weekly.currentHours) * 10) / 10;
    recs.push({
      id: 'rec-study-hours',
      title: 'Schedule Focus Sessions',
      advice: `You need ${neededHours} more study hours this week to reach your ${goals.weeklyGoalHours}h target. Generate an AI schedule or set a Pomodoro timer.`,
      actionView: 'calendar',
      metricTag: 'Weekly Hours Goal',
    });
  }

  if (progress.completion.currentRate < goals.targetCompletionRate) {
    const activeTasks = tasks.filter((t) => !t.completed);
    recs.push({
      id: 'rec-completion',
      title: 'Clear Active Assignments',
      advice: `Your completion rate is ${progress.completion.currentRate}% (Goal: ${goals.targetCompletionRate}%). Tackle ${Math.min(3, activeTasks.length)} small tasks today to boost your score.`,
      actionView: 'tasks',
      metricTag: 'Assignment Goal',
    });
  }

  if (progress.estimatedGpa < goals.targetGpa) {
    recs.push({
      id: 'rec-gpa',
      title: 'Boost Target GPA',
      advice: `To reach your target ${goals.targetGpa} GPA, review lecture notes using the AI Tutor and complete practice quizzes for upcoming exams.`,
      actionView: 'tutor',
      metricTag: 'GPA Goal',
    });
  }

  if (progress.examPrep.pct < 70) {
    recs.push({
      id: 'rec-exam-prep',
      title: 'Increase Exam Review',
      advice: `You've completed ${progress.examPrep.currentSessions} of ${goals.targetExamPrepSessions} planned exam review sessions. Add a dedicated exam study block to your calendar.`,
      actionView: 'calendar',
      metricTag: 'Exam Prep Goal',
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: 'rec-perfect',
      title: 'Goals On Track!',
      advice: 'Outstanding job! All your academic targets are currently on track. Keep up the high consistency.',
      actionView: 'pomodoro',
      metricTag: 'Mastery Status',
    });
  }

  return recs;
}