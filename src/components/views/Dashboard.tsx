import { useMemo, useState } from 'react';
import {
  Flame, Clock, CheckCircle2, TrendingUp, Calendar, Sparkles, ArrowRight,
  Zap, Plus, BookOpen, FileText, CalendarClock, Timer, Target, ChevronRight,
  Sunrise, Sun, Moon, Award, ListChecks, Layers, ClipboardList, FlaskConical, FolderKanban,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task } from '@/lib/supabase';
import { generateInsights, calculateStreak, generateSchedule } from '@/lib/scheduler';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { localDateISO, addDays, daysBetween } from '@/lib/dates';
import { ProgressRing } from '@/components/ProgressRing';
import { InsightCard } from '@/components/InsightCard';
import { useToast } from '@/components/Toast';
import { useGamification } from '@/lib/useGamification';
import { GamificationCard } from '@/components/GamificationCard';

const TYPE_ICONS: Record<Task['type'], typeof FileText> = {
  homework: ClipboardList,
  assignment: FileText,
  project: FolderKanban,
  quiz: FlaskConical,
  exam: BookOpen,
  deadline: CalendarClock,
};

const TYPE_ACCENT: Record<Task['type'], { bg: string; text: string; bar: string }> = {
  homework: { bg: 'bg-primary-50 dark:bg-primary-950/40', text: 'text-primary-500', bar: 'bg-primary-500' },
  assignment: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-500', bar: 'bg-cyan-500' },
  project: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-500', bar: 'bg-violet-500' },
  quiz: { bg: 'bg-success-50 dark:bg-success-950/40', text: 'text-success-500', bar: 'bg-success-500' },
  exam: { bg: 'bg-accent-50 dark:bg-accent-950/40', text: 'text-accent-500', bar: 'bg-accent-500' },
  deadline: { bg: 'bg-error-50 dark:bg-error-950/40', text: 'text-error-500', bar: 'bg-error-500' },
};

const SUBJECT_PALETTE = [
  '#3380ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const CLASS_COLORS = [
  'from-primary-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
];

function getGreeting(hour: number): { text: string; icon: typeof Sunrise } {
  if (hour < 12) return { text: 'Good morning', icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun };
  return { text: 'Good evening', icon: Moon };
}

export function Dashboard(props: NavProps) {
  const { tasks, blocks, logs, notes, settings, startPomodoroForTask, onBlocksGenerated, loading, setView, onAddTask, onQuickFocus } = props;
  const { profile } = useAuth();
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const { userLevel, streak: gamifiedStreak, unlockedAchievements, allAchievements, activeQuests } = useGamification(tasks, logs, notes, blocks, settings);

  const todayISO = useMemo(() => localDateISO(new Date()), []);
  const today = useMemo(() => new Date(), []);
  const greeting = getGreeting(today.getHours());
  const GreetingIcon = greeting.icon;
  const firstName = (profile?.full_name || '').split(' ')[0] || 'Student';

  const insights = useMemo(
    () => generateInsights(tasks, blocks, logs, settings),
    [tasks, blocks, logs, settings],
  );

  const streak = useMemo(() => calculateStreak(logs), [logs]);

  const todayBlocks = useMemo(
    () => blocks.filter((b) => b.scheduled_date === todayISO),
    [blocks, todayISO],
  );

  const todayMinutes = todayBlocks.reduce((s, b) => s + b.duration_minutes, 0);
  const todayCompleted = todayBlocks.filter((b) => b.completed).length;
  const todayProgress = todayBlocks.length > 0 ? Math.round((todayCompleted / todayBlocks.length) * 100) : 0;

  const weekLogs = useMemo(() => {
    const cutoff = localDateISO(addDays(today, -6));
    return logs.filter((l) => l.date >= cutoff);
  }, [logs, today]);

  const weekMinutes = weekLogs.reduce((s, l) => s + l.minutes_studied, 0);
  const weekGoalProgress = settings.daily_goal_minutes > 0
    ? Math.min(100, Math.round((weekMinutes / (settings.daily_goal_minutes * 7)) * 100))
    : 0;

  const completedTasks = tasks.filter((t) => t.completed);
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const activeTasks = tasks.filter((t) => !t.completed);
  const upcomingTasks = useMemo(
    () => [...activeTasks].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 5),
    [activeTasks],
  );

  const recentlyCompleted = useMemo(
    () => completedTasks.slice(0, 4),
    [completedTasks],
  );

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const classes = useMemo(() => {
    const profileClasses = profile?.classes ?? [];
    const taskSubjects = tasks.map((t) => t.subject);
    const all = new Set([...profileClasses, ...taskSubjects]);
    return [...all].sort();
  }, [profile, tasks]);

  const classStats = useMemo(() => {
    return classes.map((cls) => {
      const classTasks = tasks.filter((t) => t.subject === cls);
      return {
        name: cls,
        total: classTasks.length,
        active: classTasks.filter((t) => !t.completed).length,
        completed: classTasks.filter((t) => t.completed).length,
      };
    }).filter((c) => c.total > 0);
  }, [classes, tasks]);

  const subjectData = useMemo(() => {
    const subjectMinutes = new Map<string, number>();
    for (const log of weekLogs) {
      if (log.task_id) {
        const task = taskMap.get(log.task_id);
        if (task) subjectMinutes.set(task.subject, (subjectMinutes.get(task.subject) ?? 0) + log.minutes_studied);
      }
    }
    const weekStart = localDateISO(addDays(today, -6));
    const weekEnd = localDateISO(today);
    for (const block of blocks) {
      if (block.scheduled_date >= weekStart && block.scheduled_date <= weekEnd) {
        const task = taskMap.get(block.task_id);
        if (task) subjectMinutes.set(task.subject, (subjectMinutes.get(task.subject) ?? 0) + block.duration_minutes);
      }
    }
    const entries = [...subjectMinutes.entries()]
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6);
    const total = entries.reduce((s, e) => s + e.minutes, 0);
    return entries.map((e, i) => ({
      ...e,
      pct: total > 0 ? (e.minutes / total) * 100 : 0,
      color: SUBJECT_PALETTE[i % SUBJECT_PALETTE.length],
    }));
  }, [weekLogs, blocks, taskMap, today]);

  const totalSubjectMinutes = subjectData.reduce((s, e) => s + e.minutes, 0);

  const weekDays = useMemo(() => {
    const days: { date: string; label: string; minutes: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const iso = localDateISO(d);
      const log = logs.find((l) => l.date === iso);
      days.push({
        date: iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        minutes: log?.minutes_studied ?? 0,
        isToday: iso === todayISO,
      });
    }
    return days;
  }, [logs, today, todayISO]);

  const maxDayMinutes = Math.max(...weekDays.map((d) => d.minutes), settings.daily_goal_minutes, 1);

  async function handleGenerate() {
    setGenerating(true);
    const result = generateSchedule(tasks, settings, blocks, logs, today);
    if (result.blocks.length === 0) {
      toast('info', 'No active tasks to schedule. Add tasks first.');
      setGenerating(false);
      return;
    }
    const { error: delError } = await supabase.from('study_blocks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) {
      toast('error', 'Failed to clear old schedule');
      setGenerating(false);
      return;
    }
    const { error: insError } = await supabase.from('study_blocks').insert(
      result.blocks.map((b) => ({
        task_id: b.task_id,
        scheduled_date: b.scheduled_date,
        start_time: b.start_time,
        duration_minutes: b.duration_minutes,
        completed: false,
      })),
    );
    if (insError) {
      toast('error', 'Failed to generate schedule');
      setGenerating(false);
      return;
    }
    onBlocksGenerated();
    const parts: string[] = [`${result.totalSessions} sessions planned`];
    if (result.rescheduledCount > 0) parts.push(`${result.rescheduledCount} missed session${result.rescheduledCount === 1 ? '' : 's'} rescheduled`);
    if (result.unscheduledTasks > 0) parts.push(`${result.unscheduledTasks} task${result.unscheduledTasks === 1 ? '' : 's'} couldn't fit`);
    toast('success', `Schedule generated! ${parts.join(' · ')}.`);
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      {/* FLASHY Hero greeting banner with mesh ambient glows */}
      <div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-700 p-6 sm:p-8 mb-6 animate-slide-up shadow-glow-primary border border-white/20"
      >
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-accent-400/25 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-primary-400/30 blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <GreetingIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{greeting.text}, {firstName}!</h1>
                <span className="animate-bounce">✨</span>
              </div>
              <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold rounded-2xl px-5 py-3 text-sm transition-all hover:bg-neutral-100 hover:scale-105 active:scale-95 shadow-lg shadow-black/10 shrink-0 disabled:opacity-60"
          >
            <Sparkles className={`w-4 h-4 text-accent-500 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating Schedule...' : 'Generate AI Schedule'}
          </button>
        </div>

        {/* Inline glassmorphism mini-stats */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
          <HeroStat icon={Flame} label="Day Streak" value={String(streak)} />
          <HeroStat icon={Clock} label="Today" value={`${Math.round(todayMinutes / 60 * 10) / 10}h`} />
          <HeroStat icon={CheckCircle2} label="Done Today" value={`${todayCompleted}/${todayBlocks.length}`} />
          <HeroStat icon={TrendingUp} label="Week Total" value={`${Math.round(weekMinutes / 60 * 10) / 10}h`} />
        </div>
      </div>

      {/* Gamification Level & Daily Quests Banner */}
      <div className="mb-6">
        <GamificationCard
          userLevel={userLevel}
          streak={gamifiedStreak}
          unlockedCount={unlockedAchievements.length}
          totalAchievements={allAchievements.length}
          activeQuests={activeQuests}
          setView={setView}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <QuickAction onClick={onAddTask} icon={Plus} label="Add Task" sublabel="New assignment or exam" color="primary" delay="0ms" />
        <QuickAction onClick={onQuickFocus} icon={Timer} label="Focus Session" sublabel="Start a Pomodoro" color="accent" delay="50ms" />
        <QuickAction onClick={() => setView('calendar')} icon={Calendar} label="Calendar" sublabel="View your schedule" color="success" delay="100ms" />
        <QuickAction onClick={() => setView('insights')} icon={TrendingUp} label="Insights" sublabel="Track your progress" color="primary" delay="150ms" />
      </div>

      {/* Today's Schedule + Weekly Goal */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Today's Study Plan
            </h2>
            {todayBlocks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden p-0.5 border border-neutral-200/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${todayProgress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {todayCompleted}/{todayBlocks.length}
                </span>
              </div>
            )}
          </div>

          {todayBlocks.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 mx-auto flex items-center justify-center mb-3">
                <Calendar className="w-7 h-7 text-primary-500" />
              </div>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">No sessions scheduled today</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Click "Generate AI Schedule" to let Lumora organize your day</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayBlocks.map((block) => {
                const task = taskMap.get(block.task_id);
                if (!task) return null;
                const Icon = TYPE_ICONS[task.type];
                const accent = TYPE_ACCENT[task.type];
                return (
                  <div
                    key={block.id}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all hover:shadow-md ${
                      block.completed
                        ? 'bg-success-50/50 dark:bg-success-950/20 border-success-200 dark:border-success-900/40'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200/80 dark:border-neutral-800'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500 w-16 shrink-0">
                      {block.start_time.slice(0, 5)}
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
                      <Icon className={`w-4 h-4 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${block.completed ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">{task.subject} · {block.duration_minutes} min</p>
                    </div>
                    {!block.completed && (
                      <button
                        onClick={() => startPomodoroForTask(task.id)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Start
                      </button>
                    )}
                    {block.completed && (
                      <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6 animate-slide-up flex flex-col" style={{ animationDelay: '250ms' }}>
          <h2 className="font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2 self-start">
            <Target className="w-5 h-5 text-primary-500" />
            Weekly Goal
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ProgressRing progress={weekGoalProgress} size={150} stroke={14} color="#3380ff" />
            <p className="text-sm font-bold text-neutral-900 dark:text-white mt-4 text-center">
              {Math.round(weekMinutes)} / {settings.daily_goal_minutes * 7} min this week
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {Math.round(weekMinutes / 60 * 10) / 10}h of {Math.round(settings.daily_goal_minutes * 7 / 60 * 10) / 10}h goal
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Flame} iconBg="bg-accent-50 dark:bg-accent-950/40" iconColor="text-accent-500" value={String(streak)} label="Day Streak" delay="300ms" />
        <StatCard icon={Clock} iconBg="bg-primary-50 dark:bg-primary-950/40" iconColor="text-primary-500" value={`${Math.round(weekMinutes / 60 * 10) / 10}h`} label="This Week" delay="350ms" />
        <StatCard icon={CheckCircle2} iconBg="bg-success-50 dark:bg-success-950/40" iconColor="text-success-500" value={String(completedTasks.length)} label="Tasks Done" delay="400ms" />
        <StatCard icon={TrendingUp} iconBg="bg-violet-50 dark:bg-violet-950/40" iconColor="text-violet-500" value={`${taskProgress}%`} label="Completion Rate" delay="450ms" />
      </div>

      {/* Upcoming Deadlines + Classes Quick Access */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-error-500" />
              Upcoming Deadlines
            </h2>
            <button
              onClick={() => setView('tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-success-50 dark:bg-success-950/30 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-success-500" />
              </div>
              <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingTasks.map((task: Task) => {
                const daysLeft = daysBetween(today, new Date(task.due_date));
                const urgent = daysLeft <= 2;
                const Icon = TYPE_ICONS[task.type];
                const accent = TYPE_ACCENT[task.type];
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                    <div className={`w-1.5 h-10 rounded-full ${urgent ? 'bg-error-500' : accent.bar}`} />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
                      <Icon className={`w-4 h-4 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{task.title}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{task.subject} · {task.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${urgent ? 'text-error-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {daysLeft <= 0 ? 'Due today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Classes Quick Access */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '550ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-500" />
              Your Classes
            </h2>
            <button
              onClick={() => setView('tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              View tasks
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {classStats.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-3">No classes added yet</p>
              <button onClick={() => setView('account')} className="btn-secondary text-xs mx-auto">
                Add classes in Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {classStats.slice(0, 6).map((cls, i) => {
                const gradient = CLASS_COLORS[i % CLASS_COLORS.length];
                const completionPct = cls.total > 0 ? Math.round((cls.completed / cls.total) * 100) : 0;
                return (
                  <button
                    key={cls.name}
                    onClick={() => setView('tasks')}
                    className="relative overflow-hidden rounded-2xl p-3.5 text-left group hover:shadow-md hover:-translate-y-0.5 transition-all border border-neutral-200/60 dark:border-neutral-800"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-2.5 text-white shadow-md`}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{cls.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 shrink-0">
                          {cls.active} left
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <h2 className="font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-500 animate-pulse" />
          AI Recommendations
        </h2>
        <div className="grid md:grid-cols-3 gap-3.5">
          {insights.slice(0, 3).map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
      <Icon className="w-4 h-4 text-white/80 shrink-0" />
      <div>
        <p className="text-base font-extrabold text-white leading-none">{value}</p>
        <p className="text-[10px] font-medium text-white/70 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({
  onClick, icon: Icon, label, sublabel, color, delay,
}: {
  onClick: () => void;
  icon: typeof Plus;
  label: string;
  sublabel: string;
  color: 'primary' | 'accent' | 'success';
  delay: string;
}) {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-950/40 text-primary-500 group-hover:bg-primary-500 group-hover:text-white',
    accent: 'bg-accent-50 dark:bg-accent-950/40 text-accent-500 group-hover:bg-accent-500 group-hover:text-white',
    success: 'bg-success-50 dark:bg-success-950/40 text-success-500 group-hover:bg-success-500 group-hover:text-white',
  };
  return (
    <button
      onClick={onClick}
      className="card p-4 flex items-center gap-3 hover:shadow-glow-primary hover:-translate-y-1 transition-all duration-300 group animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-neutral-900 dark:text-white">{label}</p>
        <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">{sublabel}</p>
      </div>
    </button>
  );
}

function StatCard({
  icon: Icon, iconBg, iconColor, value, label, delay,
}: {
  icon: typeof Flame;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  delay: string;
}) {
  return (
    <div className="card p-5 animate-slide-up" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">{value}</span>
      </div>
      <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}