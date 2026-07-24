import { useMemo, useEffect, useRef } from 'react';
import type { Task, StudyLog, Note, StudyBlock, Settings } from './supabase';
import { calculateStreak } from './scheduler';
import {
  calculateTotalXp,
  getLevelFromXp,
  ACHIEVEMENTS,
  DAILY_QUESTS,
  type GamificationData,
  type Achievement,
  type DailyQuest,
  type UserLevel,
} from './gamification';
import { useToast } from '@/components/Toast';

const UNLOCKED_KEY = 'lumora_unlocked_achievements_v1';

export function useGamification(
  tasks: Task[],
  logs: StudyLog[],
  notes: Note[],
  blocks: StudyBlock[],
  settings: Settings,
) {
  const toast = useToast();

  const streak = useMemo(() => calculateStreak(logs), [logs]);

  const data: GamificationData = useMemo(() => ({
    tasks,
    logs,
    notes,
    blocks,
    streak,
    dailyGoalMinutes: settings.daily_goal_minutes,
  }), [tasks, logs, notes, blocks, streak, settings.daily_goal_minutes]);

  const totalXp = useMemo(() => calculateTotalXp(data), [data]);
  const userLevel: UserLevel = useMemo(() => getLevelFromXp(totalXp), [totalXp]);

  const previousLevelRef = useRef<number | null>(null);

  // Unlocked achievements state
  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter((ach) => ach.condition(data));
  }, [data]);

  // Handle Level-Up notifications
  useEffect(() => {
    if (previousLevelRef.current === null) {
      previousLevelRef.current = userLevel.level;
      return;
    }

    if (userLevel.level > previousLevelRef.current) {
      toast('success', `🎉 LEVEL UP! You reached Level ${userLevel.level}: ${userLevel.title}!`);
      previousLevelRef.current = userLevel.level;
    }
  }, [userLevel, toast]);

  // Quests state
  const activeQuests = useMemo(() => {
    return DAILY_QUESTS.map((q) => {
      const completed = q.isCompleted(data);
      const progress = q.getProgress(data);
      return {
        ...q,
        completed,
        progress,
      };
    });
  }, [data]);

  const completedQuestsCount = activeQuests.filter((q) => q.completed).length;

  return {
    totalXp,
    userLevel,
    streak,
    unlockedAchievements,
    allAchievements: ACHIEVEMENTS,
    activeQuests,
    completedQuestsCount,
    totalQuestsCount: DAILY_QUESTS.length,
  };
}