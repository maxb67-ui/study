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
    <div className="card p-6 animate-slide-up bg-gradient-to-br from-white via-white to-primary-50/40 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-950/30 border-primary-200/60 dark:border-primary-800/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
        {/* Level badge and Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white font-black text-xl shadow-glow-accent shrink-0">
            Lvl {userLevel.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">{userLevel.title}</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60">
                {userLevel.totalXp} XP
              </span>
            </div>
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mt-0.5">
              {userLevel.currentLevelXp} / {userLevel.xpForNextLevel} XP to Level {userLevel.level + 1}
            </p>
          </div>
        </div>

        <button
          onClick={() => setView('achievements')}
          className="btn-secondary text-xs shrink-0 self-start sm:self-auto font-bold"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          View All Badges ({unlockedCount}/{totalAchievements})
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Level Progress Bar */}
      <div className="my-4">
        <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-neutral-800/80 overflow-hidden p-0.5 border border-neutral-200/60 dark:border-neutral-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-500 via-amber-400 to-primary-500 transition-all duration-700 shadow-sm"
            style={{ width: `${userLevel.progressPct}%` }}
          />
        </div>
      </div>

      {/* Daily Quests Grid */}
      <div>
        <p className="label text-[10px] mb-2.5 flex items-center gap-1.5 font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Daily Quests
        </p>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {activeQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                quest.completed
                  ? 'bg-success-50/80 dark:bg-success-950/30 border-success-300 dark:border-success-800/60'
                  : 'bg-neutral-50/80 dark:bg-neutral-800/50 border-neutral-200/80 dark:border-neutral-700/80'
              }`}
            >
              <span className="text-xl shrink-0">{quest.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${quest.completed ? 'text-success-800 dark:text-success-300 line-through' : 'text-neutral-900 dark:text-white'}`}>
                  {quest.title}
                </p>
                <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 mt-0.5">
                  <span className="text-amber-600 dark:text-amber-400">+{quest.xp} XP</span>
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