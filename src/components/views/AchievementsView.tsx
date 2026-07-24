import { useState, useMemo } from 'react';
import {
  Trophy, Award, Zap, Flame, CheckCircle2, Lock, Star, Sparkles, BookOpen, Clock, Target,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import { PageHeader } from '@/components/PageHeader';
import { useGamification } from '@/lib/useGamification';
import type { AchievementCategory } from '@/lib/gamification';

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Badges' },
  { id: 'tasks', label: 'Assignments' },
  { id: 'focus', label: 'Focus & Pomodoro' },
  { id: 'streak', label: 'Streaks' },
  { id: 'notes', label: 'Notes' },
  { id: 'goals', label: 'Daily Goals' },
];

export function AchievementsView(props: NavProps) {
  const { tasks, logs, notes, blocks, settings, loading } = props;
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  const {
    totalXp,
    userLevel,
    streak,
    unlockedAchievements,
    allAchievements,
    activeQuests,
    completedQuestsCount,
    totalQuestsCount,
  } = useGamification(tasks, logs, notes, blocks, settings);

  const unlockedIds = useMemo(() => new Set(unlockedAchievements.map((a) => a.id)), [unlockedAchievements]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return allAchievements;
    return allAchievements.filter((a) => a.category === selectedCategory);
  }, [allAchievements, selectedCategory]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Achievements & Level Rank"
        subtitle="Earn XP, maintain study streaks & unlock achievement badges for consistent learning"
      />

      {/* Hero Level & XP Stats Banner */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white shadow-lg shadow-primary-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-inner">
              {userLevel.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-white/70">Current Level</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  {totalXp} XP
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-0.5">{userLevel.title}</h2>
              <p className="text-xs text-white/80 mt-1">
                {userLevel.currentLevelXp} / {userLevel.xpForNextLevel} XP needed for Level {userLevel.level + 1}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-white/20 pt-4 sm:pt-0 sm:pl-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <span className="text-xl font-bold text-white block">{streak} Days</span>
              <span className="text-[10px] text-white/70">Current Streak</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <span className="text-xl font-bold text-white block">{unlockedAchievements.length} / {allAchievements.length}</span>
              <span className="text-[10px] text-white/70">Badges Unlocked</span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/15">
          <div className="h-3 w-full rounded-full bg-black/20 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-accent-400 transition-all duration-700"
              style={{ width: `${userLevel.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Quests Section */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Daily Quests ({completedQuestsCount}/{totalQuestsCount} Done)
          </h3>
          <span className="text-xs text-neutral-400">Resets daily</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {activeQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                quest.completed
                  ? 'bg-success-50 dark:bg-success-950/20 border-success-200 dark:border-success-800'
                  : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xl">{quest.icon}</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    +{quest.xp} XP
                  </span>
                </div>
                <h4 className={`text-xs font-semibold ${quest.completed ? 'text-success-800 dark:text-success-300 line-through' : 'text-neutral-900 dark:text-white'}`}>
                  {quest.title}
                </h4>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Progress: {quest.progress.current}/{quest.progress.max}</span>
                {quest.completed && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const isUnlocked = unlockedIds.has(ach.id);
          const progress = ach.getProgress(props as any);

          return (
            <div
              key={ach.id}
              className={`card p-4 flex items-start gap-3.5 transition-all relative overflow-hidden ${
                isUnlocked
                  ? 'border-primary-200 dark:border-primary-800/60 bg-gradient-to-br from-white to-primary-50/20 dark:from-neutral-900 dark:to-primary-950/10'
                  : 'opacity-70 bg-neutral-50/50 dark:bg-neutral-900/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                isUnlocked
                  ? 'bg-primary-50 dark:bg-primary-950/40 ring-2 ring-primary-300 dark:ring-primary-700'
                  : 'bg-neutral-100 dark:bg-neutral-800 grayscale'
              }`}>
                {ach.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">{ach.title}</h4>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded shrink-0">
                    +{ach.xpReward} XP
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-snug mb-2">
                  {ach.description}
                </p>

                {/* Progress status */}
                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <span>{progress.current} / {progress.max}</span>
                  {isUnlocked ? (
                    <span className="font-bold text-success-600 dark:text-success-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}