import type { Task, StudyBlock, StudyLog, Settings } from './supabase';
import { localDateISO, addDays, daysBetween } from './dates';

export type SubjectPerformance = {
  subject: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  estimatedHours: number;
  loggedMinutes: number;
  avgDifficulty: number;
  color: string;
};

export type ConsistencyMetrics = {
  streak: number;
  activeDays30: number;
  consistencyRate: number; // 0-100%
  longestStreak: number;
  totalHoursStudied: number;
  dailyAverageMinutes: number;
};

export type GoalMetrics = {
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  todayMinutes: number;
  todayProgressPct: number;
  weekMinutes: number;
  weekProgressPct: number;
  daysGoalMetThisWeek: number;
};

export type ProductivityTrend = {
  label: string;
  value: number;
  pct: number;
};

export type AIRecommendation = {
  id: string;
  category: 'habit' | 'balance' | 'urgency' | 'burnout' | 'streak';
  title: string;
  description: string;
  actionLabel?: string;
  targetView?: 'tasks' | 'calendar' | 'pomodoro' | 'account';
  priority: 'high' | 'medium' | 'low';
};

const PALETTE = [
  '#3380ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function computeSubjectPerformance(
  tasks: Task[],
  logs: StudyLog[],
  blocks: StudyBlock[],
): SubjectPerformance[] {
  const subjectsMap = new Map<string, {
    totalTasks: number;
    completedTasks: number;
    estimatedHours: number;
    difficultySum: number;
    loggedMinutes: number;
  }>();

  for (const task of tasks) {
    const sub = task.subject || 'General';
    const existing = subjectsMap.get(sub) || {
      totalTasks: 0,
      completedTasks: 0,
      estimatedHours: 0,
      difficultySum: 0,
      loggedMinutes: 0,
    };

    existing.totalTasks += 1;
    if (task.completed) existing.completedTasks += 1;
    existing.estimatedHours += task.estimated_hours || 0;
    existing.difficultySum += task.difficulty || 3;
    subjectsMap.set(sub, existing);
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  for (const log of logs) {
    if (log.task_id) {
      const task = taskMap.get(log.task_id);
      if (task) {
        const sub = task.subject || 'General';
        const curr = subjectsMap.get(sub);
        if (curr) curr.loggedMinutes += log.minutes_studied;
      }
    }
  }

  for (const block of blocks) {
    if (block.completed) {
      const task = taskMap.get(block.task_id);
      if (task) {
        const sub = task.subject || 'General';
        const curr = subjectsMap.get(sub);
        if (curr) curr.loggedMinutes += block.duration_minutes;
      }
    }
  }

  return Array.from(subjectsMap.entries()).map(([subject, data], index) => {
    const completionRate = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;
    const avgDifficulty = data.totalTasks > 0 ? Math.round((data.difficultySum / data.totalTasks) * 10) / 10 : 3;

    return {
      subject,
      totalTasks: data.totalTasks,
      completedTasks: data.completedTasks,
      completionRate,
      estimatedHours: data.estimatedHours,
      loggedMinutes: data.loggedMinutes,
      avgDifficulty,
      color: PALETTE[index % PALETTE.length],
    };
  }).sort((a, b) => b.loggedMinutes - a.loggedMinutes);
}

export function computeProductivityTrends(logs: StudyLog[]): ProductivityTrend[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMins = new Array(7).fill(0);
  
  logs.forEach(log => {
    const d = new Date(log.date + 'T00:00:00');
    dayMins[d.getDay()] += log.minutes_studied;
  });

  const max = Math.max(...dayMins, 1);
  return days.map((label, i) => ({
    label,
    value: dayMins[i],
    pct: Math.round((dayMins[i] / max) * 100)
  }));
}

export function computeConsistency(logs: StudyLog[]): ConsistencyMetrics {
  const today = new Date();
  const studyDays = new Set(logs.filter((l) => l.minutes_studied > 0).map((l) => l.date));

  let activeDays30 = 0;
  for (let i = 0; i < 30; i++) {
    const iso = localDateISO(addDays(today, -i));
    if (studyDays.has(iso)) activeDays30 += 1;
  }

  let currentStreak = 0;
  const cursor = new Date(today);
  if (!studyDays.has(localDateISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (studyDays.has(localDateISO(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDates = Array.from(studyDays).sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diff = daysBetween(lastDate, d);
      if (diff === 1) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    }
    lastDate = d;
    if (tempStreak > maxStreak) maxStreak = tempStreak;
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutes_studied, 0);

  return {
    streak: currentStreak,
    activeDays30,
    consistencyRate: Math.round((activeDays30 / 30) * 100),
    longestStreak: Math.max(maxStreak, currentStreak),
    totalHoursStudied: Math.round((totalMinutes / 60) * 10) / 10,
    dailyAverageMinutes: activeDays30 > 0 ? Math.round(totalMinutes / activeDays30) : 0,
  };
}

export function computeGoals(
  settings: Settings,
  logs: StudyLog[],
  blocks: StudyBlock[],
): GoalMetrics {
  const todayISO = localDateISO(new Date());

  const todayLogsMin = logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
  const todayBlocksMin = blocks.filter((b) => b.scheduled_date === todayISO && b.completed).reduce((s, b) => s + b.duration_minutes, 0);
  const todayMinutes = Math.max(todayLogsMin, todayBlocksMin);

  let weekMinutes = 0;
  let daysGoalMetThisWeek = 0;
  const target = settings.daily_goal_minutes || 120;

  for (let i = 0; i < 7; i++) {
    const iso = localDateISO(addDays(new Date(), -i));
    const dayMin = logs.filter((l) => l.date === iso).reduce((s, l) => s + l.minutes_studied, 0);
    weekMinutes += dayMin;
    if (dayMin >= target) daysGoalMetThisWeek += 1;
  }

  const weeklyTarget = target * 7;

  return {
    dailyGoalMinutes: target,
    weeklyGoalMinutes: weeklyTarget,
    todayMinutes,
    todayProgressPct: Math.min(100, Math.round((todayMinutes / target) * 100)),
    weekMinutes,
    weekProgressPct: Math.min(100, Math.round((weekMinutes / weeklyTarget) * 100)),
    daysGoalMetThisWeek,
  };
}

export function generateSmartRecommendations(
  tasks: Task[],
  blocks: StudyBlock[],
  logs: StudyLog[],
  settings: Settings,
): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  const today = new Date();
  const todayISO = localDateISO(today);

  const activeTasks = tasks.filter((t) => !t.completed);
  const overdueTasks = activeTasks.filter((t) => new Date(t.due_date) < today);
  const upcomingExams = activeTasks.filter((t) => t.type === 'exam');

  const subjectStats = computeSubjectPerformance(tasks, logs, blocks);
  const consistency = computeConsistency(logs);

  const hardSubjects = subjectStats.filter((s) => s.avgDifficulty >= 4);
  for (const sub of hardSubjects) {
    if (sub.loggedMinutes < 30 && sub.totalTasks > 0) {
      recs.push({
        id: `neglect-${sub.subject}`,
        category: 'balance',
        title: `Prioritize ${sub.subject}`,
        description: `${sub.subject} has a high difficulty rating, but you've logged under 30 mins this week. Schedule a focus block tomorrow.`,
        actionLabel: 'Go to Calendar',
        targetView: 'calendar',
        priority: 'high',
      });
    }
  }

  if (overdueTasks.length > 0) {
    recs.push({
      id: 'overdue-alert',
      category: 'urgency',
      title: `Clear ${overdueTasks.length} Overdue Tasks`,
      description: `Procrastination builds pressure. Use the Pomodoro timer to clear one overdue task right now.`,
      actionLabel: 'View Tasks',
      targetView: 'tasks',
      priority: 'high',
    });
  }

  for (const exam of upcomingExams) {
    const daysLeft = daysBetween(today, new Date(exam.due_date));
    if (daysLeft >= 0 && daysLeft <= 5) {
      const examBlocks = blocks.filter((b) => b.task_id === exam.id);
      if (examBlocks.length < 2) {
        recs.push({
          id: `exam-prep-${exam.id}`,
          category: 'urgency',
          title: `Upcoming Exam: ${exam.title}`,
          description: `Exam in ${daysLeft} days. Regenerate your AI schedule to ensure review sessions are distributed evenly.`,
          actionLabel: 'Regenerate Schedule',
          targetView: 'calendar',
          priority: 'high',
        });
      }
    }
  }

  if (consistency.streak > 2) {
    const todayLog = logs.find((l) => l.date === todayISO);
    if (!todayLog || todayLog.minutes_studied < 15) {
      recs.push({
        id: 'streak-keep',
        category: 'streak',
        title: `Protect Your ${consistency.streak}-Day Streak!`,
        description: `Log just 15 minutes of study today to keep your momentum alive.`,
        actionLabel: 'Start Timer',
        targetView: 'pomodoro',
        priority: 'medium',
      });
    }
  }

  return recs;
}