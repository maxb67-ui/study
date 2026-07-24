import { useMemo, useState, useEffect } from 'react';
import { Flame, TrendingUp, Award, Target, Bell, Clock, Save, BarChart3, Calendar } from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import { generateInsights, calculateStreak } from '@/lib/scheduler';
import { localDateISO, addDays } from '@/lib/dates';
import { PageHeader } from '@/components/PageHeader';
import { InsightCard } from '@/components/InsightCard';
import { ProgressRing } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';

export function InsightsView(props: NavProps) {
  const { tasks, blocks, logs, settings, updateSettings, loading } = props;
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

  const insights = useMemo(
    () => generateInsights(tasks, blocks, logs, settings),
    [tasks, blocks, logs, settings],
  );

  const streak = useMemo(() => calculateStreak(logs), [logs]);

  const todayISO = useMemo(() => localDateISO(new Date()), []);

  const weekDays = useMemo(() => {
    const days: { date: string; label: string; minutes: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(new Date(), -i);
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
  }, [logs, todayISO]);

  const maxMinutes = Math.max(...weekDays.map((d) => d.minutes), settings.daily_goal_minutes, 1);
  const weekTotal = weekDays.reduce((s, d) => s + d.minutes, 0);
  const weekAvg = Math.round(weekTotal / 7);

  const streakHistory = useMemo(() => {
    const days: { date: string; studied: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const iso = localDateISO(d);
      const log = logs.find((l) => l.date === iso);
      days.push({ date: iso, studied: (log?.minutes_studied ?? 0) > 0 });
    }
    return days;
  }, [logs]);

  const activeDays = streakHistory.filter((d) => d.studied).length;
  const consistency = Math.round((activeDays / 30) * 100);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function saveSettings() {
    if (startTime >= endTime) {
      toast('error', 'Study end time must be after start time');
      return;
    }
    if (dailyGoal < 15 || dailyGoal > 600) {
      toast('error', 'Daily goal must be between 15 and 600 minutes');
      return;
    }
    if (pomoLen < 10 || pomoLen > 60) {
      toast('error', 'Pomodoro length must be between 10 and 60 minutes');
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
    toast('success', 'Settings saved');
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Insights & Progress"
        subtitle="Track your habits and stay motivated"
        action={
          <button onClick={() => setShowSettings((s) => !s)} className="btn-secondary">
            <Bell className="w-4 h-4" />
            Settings
          </button>
        }
      />

      {showSettings && (
        <div className="card p-5 mb-6 animate-scale-in">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" />
            Study Preferences
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
              <label className="label">Study Start Time</label>
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Study End Time</label>
              <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button
                onClick={() => setReminders((r) => !r)}
                className={`relative w-11 h-6 rounded-full transition-all ${reminders ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${reminders ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Study reminders</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowSettings(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={saveSettings} disabled={saving} className="btn-primary flex-1">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-950/30 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-accent-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{streak}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Day streak</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{weekAvg}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Avg min/day</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-success-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{consistency}%</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Consistency</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{completionRate}%</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">Tasks done</p>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary-500" />
          This Week's Study Time
        </h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {weekDays.map((day) => {
            const heightPct = (day.minutes / maxMinutes) * 100;
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
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Total: {Math.round(weekTotal)} min ({Math.round(weekTotal / 60 * 10) / 10}h)</span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Goal: {settings.daily_goal_minutes} min/day</span>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent-500" />
          30-Day Activity
        </h2>
        <div className="grid grid-cols-10 gap-1.5">
          {streakHistory.map((day) => (
            <div
              key={day.date}
              className={`aspect-square rounded-md transition-all ${
                day.studied
                  ? 'bg-success-400 hover:scale-110'
                  : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
              title={`${day.date}: ${day.studied ? 'Studied' : 'No activity'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success-400" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Studied ({activeDays} days)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">No activity</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 self-start">Task Completion</h3>
          <ProgressRing progress={completionRate} size={140} stroke={12} color="#10b981" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 text-center">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-accent-500" />
            Motivational Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        </div>
      </div>

      {settings.reminders_enabled && (
        <div className="card p-4 mt-6 flex items-center gap-3 bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800">
          <Bell className="w-5 h-5 text-primary-500 shrink-0" />
          <p className="text-sm text-primary-700 dark:text-primary-300">
            Reminders are on. You'll see study prompts based on your scheduled sessions between {settings.study_start_time.slice(0, 5)} and {settings.study_end_time.slice(0, 5)}.
          </p>
        </div>
      )}
    </div>
  );
}
