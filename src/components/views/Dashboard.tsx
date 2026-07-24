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
  homework: { bg: 'bg-primary-50 dark:bg-primary-950/30', text: 'text-primary-500', bar: 'bg-primary-400' },
  assignment: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-500', bar: 'bg-cyan-400' },
  project: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-500', bar: 'bg-violet-400' },
  quiz: { bg: 'bg-success-50 dark:bg-success-950/30', text: 'text-success-500', bar: 'bg-success-400' },
  exam: { bg: 'bg-accent-50 dark:bg-accent-950/30', text: 'text-accent-500', bar: 'bg-accent-400' },
  deadline: { bg: 'bg-error-50 dark:bg-error-950/30', text: 'text-error-500', bar: 'bg-error-400' },
};

const SUBJECT_PALETTE = [
  '#3380ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const CLASS_COLORS = [
  'from-primary-400 to-primary-600',
  'from-success-400 to-success-600',
  'from-accent-400 to-accent-600',
  'from-error-400 to-error-600',
  'from-warning-400 to-warning-600',
  'from-cyan-400 to-cyan-600',
  'from-rose-400 to-rose-600',
  'from-lime-400 to-lime-600',
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

  // Classes from profile + derived from tasks
  const classes = useMemo(() => {
    const profileClasses = profile?.classes ?? [];
    const taskSubjects = tasks.map((t) => t.subject);
    const all = new Set([...profileClasses, ...taskSubjects]);
    return [...all].sort();
  }, [profile, tasks]);

  // Per-class task counts
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

  // Study hours by subject
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

  // Weekly bar chart data
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
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      {/* Hero greeting card */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-5 sm:p-6 mb-6 animate-slide-up shadow-lg shadow-primary-500/20"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <GreetingIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{greeting.text}, {firstName}</h1>
              <p className="text-sm text-white/70 mt-0.5">
                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60 shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>

        {/* Inline mini-stats */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/15">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <QuickAction onClick={onAddTask} icon={Plus} label="Add Task" sublabel="New assignment or exam" color="primary" delay="0ms" />
        <QuickAction onClick={onQuickFocus} icon={Timer} label="Focus Session" sublabel="Start a Pomodoro" color="accent" delay="50ms" />
        <QuickAction onClick={() => setView('calendar')} icon={Calendar} label="Calendar" sublabel="View your schedule" color="success" delay="100ms" />
        <QuickAction onClick={() => setView('insights')} icon={TrendingUp} label="Insights" sublabel="Track your progress" color="primary" delay="150ms" />
      </div>

      {/* Today's Schedule + Weekly Goal */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              Today's Study Plan
            </h2>
            {todayBlocks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${todayProgress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {todayCompleted}/{todayBlocks.length}
                </span>
              </div>
            )}
          </div>

          {todayBlocks.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
                <Calendar className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">No sessions scheduled today</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Click "Generate Schedule" to let AI plan your day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayBlocks.map((block) => {
                const task = taskMap.get(block.task_id);
                if (!task) return null;
                const Icon = TYPE_ICONS[task.type];
                const accent = TYPE_ACCENT[task.type];
                return (
                  <div
                    key={block.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                      block.completed
                        ? 'bg-success-50 dark:bg-success-950/20 border-success-200 dark:border-success-900'
                        : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 w-16 shrink-0">
                      {block.start_time.slice(0, 5)}
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
                      <Icon className={`w-4 h-4 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${block.completed ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-900 dark:text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{task.subject} · {block.duration_minutes} min</p>
                    </div>
                    {!block.completed && (
                      <button
                        onClick={() => startPomodoroForTask(task.id)}
                        className="btn-ghost text-xs px-2 py-1.5"
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

        <div className="card p-5 animate-slide-up flex flex-col" style={{ animationDelay: '250ms' }}>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 self-start">
            <Target className="w-4 h-4 text-primary-500" />
            Weekly Goal
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ProgressRing progress={weekGoalProgress} size={140} stroke={12} />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 text-center">
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
        <StatCard icon={Flame} iconBg="bg-accent-50 dark:bg-accent-950/30" iconColor="text-accent-500" value={String(streak)} label="Day Streak" delay="300ms" />
        <StatCard icon={Clock} iconBg="bg-primary-50 dark:bg-primary-950/30" iconColor="text-primary-500" value={`${Math.round(weekMinutes / 60 * 10) / 10}h`} label="This Week" delay="350ms" />
        <StatCard icon={CheckCircle2} iconBg="bg-success-50 dark:bg-success-950/30" iconColor="text-success-500" value={String(completedTasks.length)} label="Tasks Done" delay="400ms" />
        <StatCard icon={TrendingUp} iconBg="bg-primary-50 dark:bg-primary-950/30" iconColor="text-primary-500" value={`${taskProgress}%`} label="Completion" delay="450ms" />
      </div>

      {/* Upcoming Deadlines + Classes Quick Access */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-error-500" />
              Upcoming Deadlines
            </h2>
            <button
              onClick={() => setView('tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-success-500" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task: Task) => {
                const daysLeft = daysBetween(today, new Date(task.due_date));
                const urgent = daysLeft <= 2;
                const Icon = TYPE_ICONS[task.type];
                const accent = TYPE_ACCENT[task.type];
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
                    <div className={`w-1 h-10 rounded-full ${urgent ? 'bg-error-400' : accent.bar}`} />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
                      <Icon className={`w-4 h-4 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{task.title}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{task.subject} · {task.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${urgent ? 'text-error-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
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
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '550ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-500" />
              Your Classes
            </h2>
            <button
              onClick={() => setView('tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              View tasks
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {classStats.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-3">No classes yet</p>
              <button onClick={() => setView('account')} className="btn-secondary text-xs mx-auto">
                Add classes in Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {classStats.slice(0, 6).map((cls, i) => {
                const gradient = CLASS_COLORS[i % CLASS_COLORS.length];
                const completionPct = cls.total > 0 ? Math.round((cls.completed / cls.total) * 100) : 0;
                return (
                  <button
                    key={cls.name}
                    onClick={() => setView('tasks')}
                    className="relative overflow-hidden rounded-xl p-3 text-left group hover:shadow-md transition-all"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-2`}>
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{cls.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
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

      {/* Weekly Activity Chart + Study Hours by Subject */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Weekly Study Activity
          </h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {weekDays.map((day) => {
              const heightPct = (day.minutes / maxDayMinutes) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        day.isToday ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-800'
                      }`}
                      style={{ height: `${Math.max(heightPct, day.minutes > 0 ? 4 : 0)}%` }}
                      title={`${day.minutes} min`}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${day.isToday ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Total: {Math.round(weekMinutes)} min</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Goal: {settings.daily_goal_minutes} min/day</span>
          </div>
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '650ms' }}>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-500" />
            Study Hours by Subject
          </h2>
          {subjectData.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">No study data yet this week</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-5 mb-4">
                <SubjectDonut data={subjectData} totalMinutes={totalSubjectMinutes} />
                <div className="flex-1 space-y-2 min-w-0">
                  {subjectData.map((entry) => (
                    <div key={entry.subject} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate flex-1">{entry.subject}</span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">{Math.round(entry.minutes / 60 * 10) / 10}h</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                  {Math.round(totalSubjectMinutes / 60 * 10) / 10}h total across {subjectData.length} {subjectData.length === 1 ? 'subject' : 'subjects'} this week
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recently Completed + AI Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-success-500" />
              Recently Completed
            </h2>
            <button
              onClick={() => setView('tasks')}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentlyCompleted.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
                <ListChecks className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">No completed tasks yet. Finish one to see it here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentlyCompleted.map((task) => {
                const Icon = TYPE_ICONS[task.type];
                const accent = TYPE_ACCENT[task.type];
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-success-50/50 dark:bg-success-950/10">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
                      <Icon className={`w-4 h-4 ${accent.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate line-through">{task.title}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{task.subject}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '750ms' }}>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-500" />
            AI Recommendations
          </h2>
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
            <button
              onClick={() => setView('insights')}
              className="btn-ghost w-full text-xs justify-center text-primary-600 dark:text-primary-400"
            >
              View all insights
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-white/60" />
      <div>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-[10px] text-white/60 mt-0.5">{label}</p>
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
    primary: 'bg-primary-50 dark:bg-primary-950/30 text-primary-500',
    accent: 'bg-accent-50 dark:bg-accent-950/30 text-accent-500',
    success: 'bg-success-50 dark:bg-success-950/30 text-success-500',
  };
  return (
    <button
      onClick={onClick}
      className="card p-4 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all group animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{sublabel}</p>
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</span>
      </div>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}

function SubjectDonut({ data, totalMinutes }: { data: { subject: string; minutes: number; pct: number; color: string }[]; totalMinutes: number }) {
  const size = 120;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        {data.map((entry, i) => {
          const dashLength = (entry.pct / 100) * circumference;
          const dashArray = `${dashLength} ${circumference - dashLength}`;
          const dashOffset = -accumulatedOffset;
          accumulatedOffset += dashLength;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              stroke={entry.color}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke-dasharray 0.6s ease-out' }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-neutral-900 dark:text-white">{Math.round(totalMinutes / 60 * 10) / 10}h</span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">total</span>
      </div>
    </div>
  );
}