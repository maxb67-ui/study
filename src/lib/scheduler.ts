import type { Task, StudyBlock, Settings, StudyLog } from './supabase';
import { localDateISO, startOfDay, daysBetween, parseTimeToMinutes, minutesToTime, addDays } from './dates';

export type GeneratedBlock = {
  task_id: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
};

export type ScheduleResult = {
  blocks: GeneratedBlock[];
  totalSessions: number;
  totalMinutes: number;
  rescheduledMinutes: number;
  rescheduledCount: number;
  unscheduledMinutes: number;
  unscheduledTasks: number;
  burnoutDays: number;
};

const MIN_SESSION = 25;
const MAX_SESSION = 120;
const MAX_DAILY_MINUTES = 300; // 5h hard cap per day to prevent burnout
const BURNOUT_THRESHOLD = 240; // 4h — days at or above this are "heavy"

type DaySlot = {
  date: Date;
  iso: string;
  usedMinutes: number;
  maxMinutes: number;
  isWeekend: boolean;
};

type TaskPlan = {
  task: Task;
  totalMinutes: number;
  remaining: number;
  urgency: number;
};

function taskUrgency(task: Task, today: Date): number {
  const daysLeft = Math.max(0, daysBetween(today, new Date(task.due_date)));
  const deadlinePressure = daysLeft === 0 ? 5 : Math.max(0, 5 - daysLeft / 3);
  const priorityFactor = task.priority / 5;
  const difficultyFactor = task.difficulty / 5;
  // Weighted: deadline pressure dominates, then priority, then difficulty
  return deadlinePressure * 0.5 + priorityFactor * 0.3 + difficultyFactor * 0.2;
}

export function generateSchedule(
  tasks: Task[],
  settings: Settings,
  existingBlocks: StudyBlock[],
  studyLogs: StudyLog[] = [],
  today: Date = new Date(),
): ScheduleResult {
  const active = tasks.filter((t) => !t.completed);
  if (active.length === 0) {
    return { blocks: [], totalSessions: 0, totalMinutes: 0, rescheduledMinutes: 0, rescheduledCount: 0, unscheduledMinutes: 0, unscheduledTasks: 0, burnoutDays: 0 };
  }

  const startMin = parseTimeToMinutes(settings.study_start_time);
  const endMin = parseTimeToMinutes(settings.study_end_time);
  const dailyWindow = Math.max(30, endMin - startMin);
  const dailyCap = Math.min(dailyWindow, MAX_DAILY_MINUTES);

  // Determine scheduling horizon: from today to farthest deadline
  const maxDeadline = active.reduce((max, t) => {
    const d = new Date(t.due_date);
    return d > max ? d : max;
  }, today);
  const totalDays = Math.max(1, daysBetween(today, maxDeadline) + 1);

  // Track time already studied per day from logs (so we don't overload days the user already studied)
  const loggedMinutesByDate = new Map<string, number>();
  for (const log of studyLogs) {
    loggedMinutesByDate.set(log.date, (loggedMinutesByDate.get(log.date) ?? 0) + log.minutes_studied);
  }

  // Detect missed sessions: incomplete blocks before today that belong to still-active tasks
  const activeTaskIds = new Set(active.map((t) => t.id));
  const todayISO = localDateISO(today);
  let rescheduledMinutes = 0;
  let rescheduledCount = 0;

  const missedMinutesByTask = new Map<string, number>();
  for (const block of existingBlocks) {
    if (block.completed) continue;
    if (block.scheduled_date >= todayISO) continue;
    if (!activeTaskIds.has(block.task_id)) continue;
    // This is a missed session for an active task — redistribute its time
    missedMinutesByTask.set(block.task_id, (missedMinutesByTask.get(block.task_id) ?? 0) + block.duration_minutes);
    rescheduledMinutes += block.duration_minutes;
    rescheduledCount += 1;
  }

  // Build day slots
  const days: DaySlot[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(today, i);
    const iso = localDateISO(d);
    const logged = loggedMinutesByDate.get(iso) ?? 0;
    days.push({
      date: d,
      iso,
      usedMinutes: logged,
      maxMinutes: dailyCap,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }

  // Build task plans, sorted by urgency (highest first)
  const plans: TaskPlan[] = active.map((task) => {
    const baseMinutes = Math.ceil(task.estimated_hours * 60);
    const missed = missedMinutesByTask.get(task.id) ?? 0;
    return {
      task,
      totalMinutes: baseMinutes + missed,
      remaining: baseMinutes + missed,
      urgency: taskUrgency(task, today),
    };
  });
  plans.sort((a, b) => b.urgency - a.urgency);

  const blocks: GeneratedBlock[] = [];
  let unscheduledMinutes = 0;
  let unscheduledTasks = 0;

  for (const plan of plans) {
    const { task } = plan;
    const dueDate = new Date(task.due_date);
    const dueISO = localDateISO(dueDate);

    // Days available for this task: from today up to and including due date
    const availableDays = days.filter((d) => d.iso <= dueISO);
    if (availableDays.length === 0) {
      // Overdue task — schedule for today only
      const todaySlot = days[0];
      if (todaySlot) {
        availableDays.push(todaySlot);
      }
    }

    // Compute balanced daily target: spread evenly but cap to avoid burnout
    const evenPerDay = plan.totalMinutes / availableDays.length;
    // Higher-urgency tasks get slightly more per day (concentrate effort)
    const urgencyBoost = 1 + plan.urgency * 0.15;
    let targetPerDay = Math.min(dailyCap, evenPerDay * urgencyBoost);
    targetPerDay = Math.max(MIN_SESSION, Math.min(MAX_SESSION * 2, targetPerDay));

    // For exams: front-load (study earlier, taper before exam)
    // For assignments/deadlines: spread evenly with slight back-loading near due date
    const sortedDays = [...availableDays].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Determine day order and weight per day
    const dayWeights = new Map<string, number>();
    if (task.type === 'exam') {
      // Front-load: earlier days get more weight
      sortedDays.forEach((d, idx) => {
        const w = sortedDays.length > 1 ? 1 - (idx / sortedDays.length) * 0.4 : 1;
        dayWeights.set(d.iso, w);
      });
    } else {
      // Even distribution with slight increase near deadline
      sortedDays.forEach((d, idx) => {
        const w = sortedDays.length > 1 ? 0.8 + (idx / sortedDays.length) * 0.4 : 1;
        dayWeights.set(d.iso, w);
      });
    }

    // Assign sessions to days, respecting remaining capacity and burnout cap
    let remaining = plan.remaining;
    const assignToDay = (day: DaySlot, maxForThisDay: number) => {
      if (remaining <= 0) return;
      const free = day.maxMinutes - day.usedMinutes;
      if (free < MIN_SESSION) return;
      let sessionLen = Math.min(maxForThisDay, free, remaining, MAX_SESSION);
      sessionLen = Math.max(MIN_SESSION, Math.round(sessionLen / 5) * 5);
      if (sessionLen > free) sessionLen = Math.floor(free / 5) * 5;
      if (sessionLen < MIN_SESSION) return;

      blocks.push({
        task_id: task.id,
        scheduled_date: day.iso,
        start_time: minutesToTime(startMin + day.usedMinutes),
        duration_minutes: sessionLen,
      });
      day.usedMinutes += sessionLen;
      remaining -= sessionLen;
    };

    // First pass: assign target per day (weighted)
    for (const day of sortedDays) {
      if (remaining <= 0) break;
      const weight = dayWeights.get(day.iso) ?? 1;
      const maxForDay = Math.min(targetPerDay * weight, dailyCap - day.usedMinutes);
      assignToDay(day, maxForDay);
    }

    // Second pass: if still remaining, fill any day with capacity (earliest first)
    if (remaining > 0) {
      for (const day of sortedDays) {
        if (remaining <= 0) break;
        assignToDay(day, dailyCap - day.usedMinutes);
      }
    }

    // Third pass: if STILL remaining (all days full), try days beyond deadline
    if (remaining > 0) {
      const extraDays = days.filter((d) => d.iso > dueISO);
      for (const day of extraDays) {
        if (remaining <= 0) break;
        assignToDay(day, dailyCap - day.usedMinutes);
      }
    }

    if (remaining > 0) {
      unscheduledMinutes += remaining;
      unscheduledTasks += 1;
    }
  }

  const totalMinutes = blocks.reduce((s, b) => s + b.duration_minutes, 0);
  const burnoutDays = days.filter((d) => d.usedMinutes >= BURNOUT_THRESHOLD).length;

  return {
    blocks,
    totalSessions: blocks.length,
    totalMinutes,
    rescheduledMinutes,
    rescheduledCount,
    unscheduledMinutes,
    unscheduledTasks,
    burnoutDays,
  };
}

export type Insight = {
  message: string;
  tone: 'positive' | 'warning' | 'neutral' | 'action';
};

export function generateInsights(
  tasks: Task[],
  blocks: StudyBlock[],
  logs: { date: string; minutes_studied: number }[],
  settings: Settings,
): Insight[] {
  const insights: Insight[] = [];
  const today = new Date();
  const todayISO = localDateISO(today);

  const active = tasks.filter((t) => !t.completed);
  const overdue = active.filter((t) => new Date(t.due_date) < today);

  if (overdue.length > 0) {
    insights.push({
      message: `You have ${overdue.length} overdue ${overdue.length === 1 ? 'item' : 'items'}. Consider rescheduling or prioritizing them today.`,
      tone: 'warning',
    });
  }

  const todayBlocks = blocks.filter((b) => b.scheduled_date === todayISO);
  const todayMinutes = todayBlocks.reduce((sum, b) => sum + b.duration_minutes, 0);
  if (todayMinutes > 0) {
    insights.push({
      message: `You have ${Math.round(todayMinutes / 60 * 10) / 10} hours of study planned today across ${todayBlocks.length} sessions.`,
      tone: 'action',
    });
  } else if (active.length > 0) {
    insights.push({
      message: 'No study sessions scheduled for today. Generate a new schedule to stay on track.',
      tone: 'neutral',
    });
  }

  // Detect missed sessions
  const missedSessions = blocks.filter((b) => !b.completed && b.scheduled_date < todayISO);
  if (missedSessions.length > 0) {
    const missedMinutes = missedSessions.reduce((s, b) => s + b.duration_minutes, 0);
    insights.push({
      message: `${missedSessions.length} missed session${missedSessions.length === 1 ? '' : 's'} (${Math.round(missedMinutes / 60 * 10) / 10}h) detected. Regenerate your schedule to automatically reschedule them.`,
      tone: 'warning',
    });
  }

  const last7Days = addDays(today, -6);
  const cutoff = localDateISO(last7Days);
  const recentLogs = logs.filter((l) => l.date >= cutoff);
  const totalWeekMinutes = recentLogs.reduce((sum, l) => sum + l.minutes_studied, 0);
  const dailyAvg = totalWeekMinutes / 7;

  if (dailyAvg >= settings.daily_goal_minutes && dailyAvg > 0) {
    insights.push({
      message: `You're averaging ${Math.round(dailyAvg)} minutes per day — exceeding your goal of ${settings.daily_goal_minutes}. Outstanding work!`,
      tone: 'positive',
    });
  } else if (dailyAvg > 0) {
    insights.push({
      message: `You're averaging ${Math.round(dailyAvg)} minutes per day. Push a little harder to reach your ${settings.daily_goal_minutes}-minute daily goal.`,
      tone: 'neutral',
    });
  }

  const upcomingExams = active.filter((t) => t.type === 'exam');
  if (upcomingExams.length > 0) {
    const nextExam = [...upcomingExams].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    const daysLeft = daysBetween(today, new Date(nextExam.due_date));
    if (daysLeft <= 7 && daysLeft >= 0) {
      insights.push({
        message: `${nextExam.subject} exam in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Focus on high-difficulty topics first.`,
        tone: 'warning',
      });
    }
  }

  // Burnout warning
  const heavyDays = blocks.filter((b) => b.scheduled_date >= todayISO).reduce((acc, b) => {
    acc.set(b.scheduled_date, (acc.get(b.scheduled_date) ?? 0) + b.duration_minutes);
    return acc;
  }, new Map<string, number>());
  const burnoutDays = [...heavyDays.entries()].filter(([, m]) => m >= 240);
  if (burnoutDays.length >= 3) {
    insights.push({
      message: `You have ${burnoutDays.length} heavy study days (4+ hours) ahead. Consider spreading the load to avoid burnout.`,
      tone: 'warning',
    });
  }

  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
    : 0;
  if (completionRate >= 75 && tasks.length > 0) {
    insights.push({
      message: `You've completed ${completionRate}% of your tasks. You're in the home stretch!`,
      tone: 'positive',
    });
  }

  if (insights.length === 0) {
    insights.push({
      message: 'Add assignments and exams to get started — your AI schedule will appear here.',
      tone: 'neutral',
    });
  }

  return insights;
}

export function calculateStreak(logs: { date: string; minutes_studied: number }[]): number {
  if (logs.length === 0) return 0;
  const studyDays = new Set(
    logs.filter((l) => l.minutes_studied > 0).map((l) => l.date),
  );
  if (studyDays.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  if (!studyDays.has(localDateISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (studyDays.has(localDateISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
