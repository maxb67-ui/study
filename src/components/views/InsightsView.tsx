import { useMemo, useState, useEffect } from 'react';
import {
  Flame, TrendingUp, Award, Target, Bell, Clock, Save, BarChart3,
  Calendar, BookOpen, Sparkles, CheckCircle2, Zap, ArrowRight,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import { PageHeader } from '@/components/PageHeader';
import { ProgressRing } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';
import {
  computeSubjectPerformance,
  computeConsistency,
  computeGoals,
  generateSmartRecommendations,
} from '@/lib/analyticsEngine';
import { localDateISO, addDays } from '@/lib/dates';

export function InsightsView(props: NavProps) {
  const { tasks, blocks, logs, settings, updateSettings, loading, setView } = props;
  const toast = useToast();
  const [showSettings, setShowSettings] = useState(false);

  const [dailyGoal, setDailyGoal] = useState(settings.daily_goal_minutes);
  const [startTime, setStartTime] = useState(settings.study_start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(settings.study_end_time.slice(0, 5));
  const [breakDur, setBreakDur] = useState(settings.break_duration_minutes);
  const [pomoLen, setPomoLen] = useState(settings.pomodoro_length_minutes);
  const [reminders, setReminders] = useState(settings.reminders_enabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDailyGoal(settings.daily_goal_minutes);
    setStartTime(settings.study_start_time.slice(0, 5));
    setEndTime(settings.study_end_time.slice(0, 5));
    setBreakDur(settings.break_duration_minutes);
    setPomoLen(settings.pomodoro_length_minutes);
    setReminders(settings.reminders_enabled);
  }, [settings]);

  // Compute analytics data
  const subjectStats = useMemo(() => computeSubjectPerformance(tasks, logs, blocks), [tasks, logs, blocks]);
  const consistency = useMemo(() => computeConsistency(logs), [logs]);
  const goals = useMemo(() => computeGoals(settings, logs, blocks), [settings, logs, blocks]);
  const aiRecommendations = useMemo(() => generateSmartRecommendations(tasks, blocks, logs, settings), [tasks, blocks, logs, settings]);

  const todayISO = useMemo(() => localDateISO(new Date()), []);

  // 7-day study activity bar chart data
  const weekDays = useMemo(() => {
    const days: { date: string; label: string; minutes: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const iso = localDateISO(d);
      const log = logs.find((l) => l.date === iso);
      const blockMin = blocks.filter((b) => b.scheduled_date === iso && b.completed).reduce((s, b) => s + b.duration_minutes, 0);
      days.push({
        date: iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
        minutes: Math.max(log?.minutes_studied ?? 0, blockMin),
        isToday: iso === todayISO,
      });
    }
    return days;
  }, [logs, blocks, todayISO]);

  const maxMinutes = Math.max(...weekDays.map((d) => d.minutes), settings.daily_goal_minutes, 1);

  // 30-Day Activity grid
  const streakHistory = useMemo(() => {
    const days: { date: string; studied: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const iso = localDateISO(d);
      const log = logs.find((l) => l.date === iso);
      const blockMin = blocks.filter((b) => b.scheduled_date === iso && b.completed).reduce((s, b) => s + b.duration_minutes, 0);
      days.push({ date: iso, studied: (log?.minutes_studied ?? 0) > 0 || blockMin > 0 });
    }
    return days;
  }, [logs, blocks]);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  function saveSettings() {
    if (startTime >= endTime) {
      toast('error', 'Study end time must be after start time');
      return;
    }
    if (dailyGoal < 15 || dailyGoal > 600) {
      toast('error', 'Daily goal must be between 15 and 600 minutes');
      return;
    }
    setSaving(true);
    updateSettings({
      daily_goal_minutes: dailyGoal,
      study_start_time: startTime + ':00',
      study_end_time: endTime + ':00',
      break_duration_minutes: breakDur,
      pomodoro_length_minutes: pomoLen,
      reminders_enabled: reminders,
    });
    setSaving(false);
    setShowSettings(false);
    toast('success', 'Preferences updated');
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Progress Dashboard"
        subtitle="Detailed analytics, subject performance & AI recommendations"
        action={
          <button onClick={() => setShowSettings((s) => !s)} className="btn-secondary">
            <Bell className="w-4 h-4" />
            Preferences
          </button>
        }
      />

      {showSettings && (
        <div className="card p-5 mb-6 animate-scale-in">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            Study Preferences & Goals
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Goal (minutes)</label>
              <input type="number" min="15" max="600" step="15" className="input" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value) || 120)} />
            </div>
            <div>
              <label className="label">Pomodoro Length (minutes)</label>
              <input type="number" min="10" max="60" step="5" className="input" value={pomoLen} onChange={(e) => setPomoLen(parseInt(e.target.value) || 25)} />
            </div>
            <div>
              <label className="label">Break Duration (minutes)</label>
              <input type="number" min="3" max="30" step="1" className="input" value={breakDur} onChange={(e) => setBreakDur(parseInt(e.target.value) || 5)} />
            </div>
            <div>
              <label className="label">Study Window Start</label>
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Study Window End</label>
              <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button
                onClick={() => setReminders((r) => !r)}
                className={`relative w-11 h-6 rounded-full transition-all ${reminders ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${reminders ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Enable Study Reminders</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowSettings(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={saveSettings} disabled={saving} className="btn-primary flex-1">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Top Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Flame}
          value={String(consistency.streak)}
          label="Day Streak"
          sublabel={`Best: ${consistency.longestStreak} days`}
          color="accent"
        />
        <MetricCard
          icon={Clock}
          value={`${consistency.totalHoursStudied}h`}
          label="Total Study Time"
          sublabel={`Avg: ${consistency.dailyAverageMinutes}m/active day`}
          color="primary"
        />
        <MetricCard
          icon={Award}
          value={`${consistency.consistencyRate}%`}
          label="30-Day Consistency"
          sublabel={`${consistency.activeDays30} active days`}
          color="success"
        />
        <MetricCard
          icon={CheckCircle2}
          value={`${taskCompletionRate}%`}
          label="Task Completion"
          sublabel={`${completedTasksCount}/${totalTasksCount} tasks finished`}
          color="primary"
        />
      </div>

      {/* Goal Progress Ring + Weekly Study Hours */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 self-start flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            Weekly Goal Completion
          </h3>
          <ProgressRing progress={goals.weekProgressPct} size={150} stroke={14} color="#3380ff" label="Weekly Target" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-4">
            {Math.round(goals.weekMinutes / 60 * 10) / 10}h / {Math.round(goals.weeklyGoalMinutes / 60 * 10) / 10}h
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Met daily goal on {goals.daysGoalMetThisWeek} of 7 days
          </p>
        </div>

        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            Study Hours (Past 7 Days)
          </h3>
          <div className="flex items-end justify-between gap-3 h-44 pt-4">
            {weekDays.map((day) => {
              const heightPct = (day.minutes / maxMinutes) * 100;
              const hours = Math.round((day.minutes / 60) * 10) / 10;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono">{hours > 0 ? `${hours}h` : '0'}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        day.isToday ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-800'
                      }`}
                      style={{ height: `${Math.max(heightPct, day.minutes > 0 ? 6 : 2)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${day.isToday ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
            <span>Goal: {settings.daily_goal_minutes} mins/day</span>
            <span>Total: {Math.round((goals.weekMinutes / 60) * 10) / 10} hours</span>
          </div>
        </div>
      </div>

      {/* Subject Performance & Coverage Matrix */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent-500" />
          Subject Performance & Time Distribution
        </h3>

        {subjectStats.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-8">
            Add tasks with subjects to view subject breakdown analytics.
          </p>
        ) : (
          <div className="space-y-4">
            {subjectStats.map((sub) => (
              <div key={sub.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span>{sub.subject}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Diff: {sub.avgDifficulty}/5</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
                    <span>{sub.completedTasks}/{sub.totalTasks} tasks ({sub.completionRate}%)</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{Math.round((sub.loggedMinutes / 60) * 10) / 10}h</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sub.completionRate}%`, backgroundColor: sub.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 30-Day Activity Heatmap */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-success-500" />
          30-Day Study Consistency Grid
        </h3>
        <div className="grid grid-cols-10 gap-1.5">
          {streakHistory.map((day) => (
            <div
              key={day.date}
              className={`aspect-square rounded-md transition-all ${
                day.studied
                  ? 'bg-success-500 hover:scale-105'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
              title={`${day.date}: ${day.studied ? 'Studied' : 'Rest day'}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success-500" />
            <span>Active Study Day ({consistency.activeDays30} days)</span>
          </div>
          <span>30-Day Consistency Rate: {consistency.consistencyRate}%</span>
        </div>
      </div>

      {/* AI Recommendations Engine Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-500 animate-pulse" />
            AI Habit Recommendations
          </h3>
          <span className="text-xs text-neutral-400">{aiRecommendations.length} insights generated</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="card p-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-error-50 dark:bg-error-950/40 text-error-600 dark:text-error-400'
                      : rec.priority === 'medium'
                      ? 'bg-warning-50 dark:bg-warning-950/40 text-warning-600 dark:text-warning-400'
                      : 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                  }`}>
                    {rec.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white mb-1">{rec.title}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{rec.description}</p>
              </div>

              {rec.actionLabel && rec.targetView && (
                <button
                  onClick={() => setView(rec.targetView!)}
                  className="btn-ghost text-xs justify-start p-0 mt-3 text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  {rec.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon, value, label, sublabel, color,
}: {
  icon: typeof Flame;
  value: string;
  label: string;
  sublabel: string;
  color: 'primary' | 'accent' | 'success';
}) {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-950/30 text-primary-500',
    accent: 'bg-accent-50 dark:bg-accent-950/30 text-accent-500',
    success: 'bg-success-50 dark:bg-success-950/30 text-success-500',
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</span>
      </div>
      <p className="text-xs font-semibold text-neutral-900 dark:text-white">{label}</p>
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{sublabel}</p>
    </div>
  );
}