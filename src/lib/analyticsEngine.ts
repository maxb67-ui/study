import type { Task, StudyBlock, StudyLog, Settings } from './supabase';
import { localDateISO, addDays, daysBetween, parseTimeToMinutes } from './dates';

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

  // Calculate study log minutes per task/subject
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

  // Also include completed study blocks
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

export function computeConsistency(logs: StudyLog[]): ConsistencyMetrics {
  const today = new Date();
  const studyDays = new Set(logs.filter((l) => l.minutes_studied > 0).map((l) => l.date));

  // 30 day history
  let activeDays30 = 0;
  for (let i = 0; i < 30; i++) {
    const iso = localDateISO(addDays(today, -i));
    if (studyDays.has(iso)) activeDays30 += 1;
  }

  // Current streak
  let currentStreak = 0;
  const cursor = new Date(today);
  if (!studyDays.has(localDateISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (studyDays.has(localDateISO(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak in logs
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

  // Today study time
  const todayLogsMin = logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
  const todayBlocksMin = blocks.filter((b) => b.scheduled_date === todayISO && b.completed).reduce((s, b) => s + b.duration_minutes, 0);
  const todayMinutes = Math.max(todayLogsMin, todayBlocksMin);

  // Past 7 days
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

  // 1. High-difficulty neglect check
  const hardSubjects = subjectStats.filter((s) => s.avgDifficulty >= 4);
  for (const sub of hardSubjects) {
    if (sub.loggedMinutes < 30 && sub.totalTasks > 0) {
      recs.push({
        id: `neglect-${sub.subject}`,
        category: 'balance',
        title: `Prioritize ${sub.subject}`,
        description: `${sub.subject} has a high difficulty rating (${sub.avgDifficulty}/5), but you've logged under 30 minutes this week. Schedule focus blocks early in the day.`,
        actionLabel: 'Schedule Study Time',
        targetView: 'calendar',
        priority: 'high',
      });
    }
  }

  // 2. Overdue task accumulation
  if (overdueTasks.length > 0) {
    recs.push({
      id: 'overdue-alert',
      category: 'urgency',
      title: `Clear ${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
      description: `You have overdue assignments. Breaking them into 25-minute Pomodoro sessions helps beat procrastination.`,
      actionLabel: 'View Overdue Tasks',
      targetView: 'tasks',
      priority: 'high',
    });
  }

  // 3. Upcoming Exam Cramming Warning
  for (const exam of upcomingExams) {
    const daysLeft = daysBetween(today, new Date(exam.due_date));
    if (daysLeft >= 0 && daysLeft <= 5) {
      const examBlocks = blocks.filter((b) => b.task_id === exam.id);
      if (examBlocks.length < 2) {
        recs.push({
          id: `exam-prep-${exam.id}`,
          category: 'urgency',
          title: `Upcoming Exam: ${exam.title}`,
          description: `Exam in ${daysLeft === 0 ? 'today' : `${daysLeft} day(s)`}. Generate an AI schedule now to distribute review sessions evenly instead of cramming.`,
          actionLabel: 'Generate Schedule',
          targetView: 'calendar',
          priority: 'high',
        });
      }
    }
  }

  // 4. Streak preservation
  if (consistency.streak > 2) {
    const todayLog = logs.find((l) => l.date === todayISO);
    if (!todayLog || todayLog.minutes_studied < 15) {
      recs.push({
        id: 'streak-keep',
        category: 'streak',
        title: `Protect Your ${consistency.streak}-Day Streak!`,
        description: `Complete a single 25-minute focus session today to keep your study momentum alive.`,
        actionLabel: 'Start Focus Session',
        targetView: 'pomodoro',
        priority: 'medium',
      });
    }
  }

  // 5. Heavy load / Burnout warning
  const todayBlocks = blocks.filter((b) => b.scheduled_date === todayISO);
  const plannedMinutes = todayBlocks.reduce((s, b) => s + b.duration_minutes, 0);
  if (plannedMinutes >= 300) {
    recs.push({
      id: 'burnout-warning',
      category: 'burnout',
      title: 'Heavy Study Day (5+ Hours)',
      description: `You have ${Math.round(plannedMinutes / 60 * 10) / 10} hours scheduled today. Be sure to take 10-15 minute breaks between sessions to retain memory.`,
      targetView: 'pomodoro',
      priority: 'medium',
    });
  }

  // 6. Habit consistency booster
  if (consistency.consistencyRate < 40 && tasks.length > 3) {
    recs.push({
      id: 'habit-booster',
      category: 'habit',
      title: 'Build Daily Consistency',
      description: `Studying 30 minutes every day yields better retention than 4-hour weekend marathons. Try lowering your daily goal to ${Math.max(30, Math.round(settings.daily_goal_minutes * 0.75))} mins.`,
      actionLabel: 'Adjust Goal',
      targetView: 'account',
      priority: 'low',
    });
  }

  // Fallback praise/encouragement
  if (recs.length === 0) {
    recs.push({
      id: 'great-job',
      category: 'habit',
      title: 'Great Study Balance!',
      description: `Your study distribution is well-balanced across subjects. Keep logging sessions and maintaining your goals!`,
      actionLabel: 'Start Focus Timer',
      targetView: 'pomodoro',
      priority: 'low',
    });
  }

  return recs;
}