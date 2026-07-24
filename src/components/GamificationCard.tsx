import { Sparkles, Award, Flame, CheckCircle2, Trophy, ArrowRight, Zap } from 'lucide-react';
import type { UserLevel, Achievement, DailyQuest } from '@/lib/gamification';
import type { View } from '@/App';

type Props = {
  userLevel: UserLevel;
  streak: number;
  unlockedCount: number;
  totalAchievements: number;
  activeQuests: (DailyQuest & { completed: boolean; progress: { current: number; max: number } })[];
  setView: (v: View) => void;
};

export function GamificationCard({
  userLevel,
  streak,
  unlockedCount,
  totalAchievements,
  activeQuests,
  setView,
}: Props) {
  return (
    <div className="card p-5 animate-slide-up bg-gradient-to-br from-white via-white to-primary-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
        {/* Level badge and Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-500 to-amber-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-accent-500/20 shrink-0">
            Lvl {userLevel.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">{userLevel.title}</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400">
                {userLevel.totalXp} Total XP
              </span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              {userLevel.currentLevelXp} / {userLevel.xpForNextLevel} XP to Level {userLevel.level + 1}
            </p>
          </div>
        </div>

        <button
          onClick={() => setView('achievements')}
          className="btn-secondary text-xs shrink-0 self-start sm:self-auto"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          View All Badges
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="my-4">
        <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden p-0.5 border border-neutral-200/50 dark:border-neutral-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-500 via-amber-500 to-primary-500 transition-all duration-700"
            style={{ width: `${userLevel.progressPct}%` }}
          />
        </div>
      </div>

      {/* Daily Quests Grid */}
      <div>
        <p className="label text-[10px] mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-500" />
          Daily Quests
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {activeQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                quest.completed
                  ? 'bg-success-50/60 dark:bg-success-950/20 border-success-200 dark:border-success-900/40'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-800'
              }`}
            >
              <span className="text-lg shrink-0">{quest.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${quest.completed ? 'text-success-800 dark:text-success-300 line-through' : 'text-neutral-900 dark:text-white'}`}>
                  {quest.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-0.5">
                  <span>+{quest.xp} XP</span>
                  <span>{quest.progress.current}/{quest.progress.max}</span>
                </div>
              </div>
              {quest.completed && <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}