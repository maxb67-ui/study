import type { Task, Note, StudyLog, StudyBlock } from './supabase';
import { localDateISO } from './dates';

export type AchievementCategory = 'streak' | 'focus' | 'tasks' | 'notes' | 'goals';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  category: AchievementCategory;
  xpReward: number;
  condition: (data: GamificationData) => boolean;
  getProgress: (data: GamificationData) => { current: number; max: number };
};

export type DailyQuest = {
  id: string;
  title: string;
  xp: number;
  icon: string;
  isCompleted: (data: GamificationData) => boolean;
  getProgress: (data: GamificationData) => { current: number; max: number };
};

export type GamificationData = {
  tasks: Task[];
  logs: StudyLog[];
  notes: Note[];
  blocks: StudyBlock[];
  streak: number;
  dailyGoalMinutes: number;
};

export type UserLevel = {
  level: number;
  title: string;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPct: number;
  totalXp: number;
};

const LEVEL_TITLES = [
  'Novice Learner',
  'Study Apprentice',
  'Focused Student',
  'Knowledge Seeker',
  'Scholar',
  'Academic Strategist',
  'Focus Specialist',
  'Master Scholar',
  'Mind Titan',
  'Grand Luminary',
];

export function getLevelFromXp(totalXp: number): UserLevel {
  // Level curve: Level 1 (0-100), Level 2 (100-250), Level 3 (250-450), Level N
  let level = 1;
  let xpRequiredForCurrent = 0;
  let xpRequiredForNext = 100;

  while (totalXp >= xpRequiredForNext) {
    level += 1;
    xpRequiredForCurrent = xpRequiredForNext;
    xpRequiredForNext = Math.round(100 * Math.pow(level, 1.4));
  }

  const currentLevelXp = totalXp - xpRequiredForCurrent;
  const xpSpan = xpRequiredForNext - xpRequiredForCurrent;
  const progressPct = Math.min(100, Math.round((currentLevelXp / xpSpan) * 100));

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    title,
    currentLevelXp,
    xpForNextLevel: xpSpan,
    progressPct,
    totalXp,
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-task',
    title: 'First Step',
    description: 'Complete your first study task or assignment.',
    icon: '🎯',
    category: 'tasks',
    xpReward: 50,
    condition: (d) => d.tasks.filter((t) => t.completed).length >= 1,
    getProgress: (d) => ({ current: Math.min(1, d.tasks.filter((t) => t.completed).length), max: 1 }),
  },
  {
    id: 'task-crusher-10',
    title: 'Task Crusher',
    description: 'Complete 10 tasks or assignments.',
    icon: '⚡',
    category: 'tasks',
    xpReward: 150,
    condition: (d) => d.tasks.filter((t) => t.completed).length >= 10,
    getProgress: (d) => ({ current: Math.min(10, d.tasks.filter((t) => t.completed).length), max: 10 }),
  },
  {
    id: 'streak-3',
    title: 'Spark of Consistency',
    description: 'Maintain a 3-day study streak.',
    icon: '🔥',
    category: 'streak',
    xpReward: 100,
    condition: (d) => d.streak >= 3,
    getProgress: (d) => ({ current: Math.min(3, d.streak), max: 3 }),
  },
  {
    id: 'streak-7',
    title: 'Unstoppable Momentum',
    description: 'Maintain a 7-day study streak.',
    icon: '🚀',
    category: 'streak',
    xpReward: 250,
    condition: (d) => d.streak >= 7,
    getProgress: (d) => ({ current: Math.min(7, d.streak), max: 7 }),
  },
  {
    id: 'focus-5-pomo',
    title: 'Focus Master',
    description: 'Complete 5 Pomodoro sessions.',
    icon: '⏱️',
    category: 'focus',
    xpReward: 150,
    condition: (d) => {
      const totalPomo = d.logs.reduce((s, l) => s + (l.pomodoro_count || 0), 0);
      return totalPomo >= 5;
    },
    getProgress: (d) => {
      const totalPomo = d.logs.reduce((s, l) => s + (l.pomodoro_count || 0), 0);
      return { current: Math.min(5, totalPomo), max: 5 };
    },
  },
  {
    id: 'study-10-hours',
    title: 'Century Club',
    description: 'Log at least 600 total study minutes (10 hours).',
    icon: '🧠',
    category: 'focus',
    xpReward: 300,
    condition: (d) => {
      const totalMins = d.logs.reduce((s, l) => s + l.minutes_studied, 0);
      return totalMins >= 600;
    },
    getProgress: (d) => {
      const totalMins = d.logs.reduce((s, l) => s + l.minutes_studied, 0);
      return { current: Math.min(600, totalMins), max: 600 };
    },
  },
  {
    id: 'note-taker-3',
    title: 'Note Architect',
    description: 'Create at least 3 class study notes.',
    icon: '📖',
    category: 'notes',
    xpReward: 100,
    condition: (d) => d.notes.length >= 3,
    getProgress: (d) => ({ current: Math.min(3, d.notes.length), max: 3 }),
  },
  {
    id: 'goal-setter',
    title: 'Goal Getter',
    description: 'Hit your daily study goal today.',
    icon: '🏆',
    category: 'goals',
    xpReward: 120,
    condition: (d) => {
      const todayISO = localDateISO(new Date());
      const todayMins = d.logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
      return todayMins >= d.dailyGoalMinutes && d.dailyGoalMinutes > 0;
    },
    getProgress: (d) => {
      const todayISO = localDateISO(new Date());
      const todayMins = d.logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
      return { current: Math.min(d.dailyGoalMinutes, todayMins), max: Math.max(1, d.dailyGoalMinutes) };
    },
  },
];

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest-focus-25',
    title: 'Log 25 Focus Minutes',
    xp: 40,
    icon: '⏱️',
    isCompleted: (d) => {
      const todayISO = localDateISO(new Date());
      const todayMins = d.logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
      return todayMins >= 25;
    },
    getProgress: (d) => {
      const todayISO = localDateISO(new Date());
      const todayMins = d.logs.filter((l) => l.date === todayISO).reduce((s, l) => s + l.minutes_studied, 0);
      return { current: Math.min(25, todayMins), max: 25 };
    },
  },
  {
    id: 'quest-complete-task',
    title: 'Finish 1 Assignment / Task',
    xp: 50,
    icon: '✅',
    isCompleted: (d) => d.tasks.filter((t) => t.completed).length > 0,
    getProgress: (d) => ({ current: Math.min(1, d.tasks.filter((t) => t.completed).length), max: 1 }),
  },
  {
    id: 'quest-note-review',
    title: 'Create or Edit a Class Note',
    xp: 35,
    icon: '📝',
    isCompleted: (d) => d.notes.length > 0,
    getProgress: (d) => ({ current: Math.min(1, d.notes.length), max: 1 }),
  },
];

export function calculateTotalXp(data: GamificationData): number {
  let xp = 0;

  // Task XP: +50 XP per completed task
  const completedTasks = data.tasks.filter((t) => t.completed);
  xp += completedTasks.length * 50;

  // Study log XP: +1 XP per minute studied
  const totalMins = data.logs.reduce((s, l) => s + l.minutes_studied, 0);
  xp += totalMins;

  // Pomodoro bonus: +20 XP per pomodoro
  const totalPomo = data.logs.reduce((s, l) => s + (l.pomodoro_count || 0), 0);
  xp += totalPomo * 20;

  // Notes XP: +25 XP per note created
  xp += data.notes.length * 25;

  // Streak XP: +15 XP per streak day
  xp += data.streak * 15;

  // Achievement bonus XP
  ACHIEVEMENTS.forEach((ach) => {
    if (ach.condition(data)) {
      xp += ach.xpReward;
    }
  });

  return xp;
}