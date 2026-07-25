import { useMemo, useState, useEffect } from 'react';
import {
  Flame, TrendingUp, Award, Target, Bell, Clock, Save, BarChart3,
  Calendar, BookOpen, Sparkles, CheckCircle2, Zap, ArrowRight,
  ChevronRight, CalendarClock, History, LayoutDashboard
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import { PageHeader } from '@/components/PageHeader';
import { ProgressRing } from '@/components/ProgressRing';
import { useToast } from '@/components/Toast';
import {
  computeSubjectPerformance,
  computeConsistency,
  computeGoals,
  computeProductivityTrends,
  generateSmartRecommendations,
} from '@/lib/analyticsEngine';
import { localDateISO, addDays, daysBetween } from '@/lib/dates';

export function InsightsView(props: NavProps) {
  const { tasks, blocks, logs, settings, updateSettings, loading, setView } = props;
  const toast = useToast();
  const [activeTab, setActiveSection] = useState<'overview' | 'subjects' | 'history'>('overview');

  const subjectStats = useMemo(() => computeSubjectPerformance(tasks, logs, blocks), [tasks, logs, blocks]);
  const consistency = useMemo(() => computeConsistency(logs), [logs]);
  const goals = useMemo(() => computeGoals(settings, logs, blocks), [settings, logs, blocks]);
  const trends = useMemo(() => computeProductivityTrends(logs), [logs]);
  const recommendations = useMemo(() => generateSmartRecommendations(tasks, blocks, logs, settings), [tasks, blocks, logs, settings]);

  const todayISO = useMemo(() => localDateISO(new Date()), []);
  
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
  const taskCompletionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

  if (loading) return <div className="p-8 animate-pulse"><div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-3xl" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader 
        title="Learning Analytics" 
        subtitle="Deep dive into your study habits, productivity trends, and academic performance" 
      />

      {/* Tab Switcher */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl gap-1 mb-6 w-full sm:w-fit">
        {[
          { id: 'overview', label: 'Summary', icon: LayoutDashboard },
          { id: 'subjects', label: 'Subject Breakdown', icon: BookOpen },
          { id: 'history', label: 'Consistency', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Core Stats Side (Common) */}
        <div className="space-y-6">
          <div className="card p-5 bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-glow-primary">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/70 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" /> Mastery Rank
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0">
                🚀
              </div>
              <div>
                <p className="text-2xl font-black">{taskCompletionRate}%</p>
                <p className="text-xs font-bold text-white/80">Overall Task Completion</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>Streak Momentum</span>
                <span>{consistency.streak} Days</span>
              </div>
              <div className="h-2 w-full rounded-full bg-black/20 overflow-hidden">
                <div className="h-full bg-white transition-all duration-700" style={{ width: `${Math.min(100, (consistency.streak / 7) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-500" />
              AI Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    rec.priority === 'high' ? 'bg-error-50 text-error-600' : 'bg-primary-50 text-primary-600'
                  }`}>
                    {rec.category}
                  </span>
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-2">{rec.title}</p>
                  <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{rec.description}</p>
                  {rec.actionLabel && (
                    <button onClick={() => setView(rec.targetView || 'dashboard')} className="text-[11px] font-black text-primary-500 mt-3 flex items-center gap-1 hover:gap-2 transition-all">
                      {rec.actionLabel} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="card p-6 flex flex-col items-center">
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-6 self-start flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-500" />
                    Weekly Progress
                  </h3>
                  <ProgressRing progress={goals.weekProgressPct} size={160} stroke={16} color="#3380ff" label="Weekly Goal" />
                  <div className="mt-6 text-center">
                    <p className="text-xl font-black text-neutral-900 dark:text-white">
                      {Math.round(goals.weekMinutes / 60 * 10) / 10}h / {Math.round(goals.weeklyGoalMinutes / 60 * 10) / 10}h
                    </p>
                    <p className="text-[11px] font-bold text-neutral-400 mt-1">Logged this week</p>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success-500" />
                    Study Trends
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-40 pt-4">
                    {trends.map((day) => (
                      <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex-1 flex items-end">
                          <div 
                            className="w-full rounded-t-lg bg-success-500/20 dark:bg-success-500/10 border-t border-x border-success-500/30 transition-all duration-500 relative group"
                            style={{ height: `${Math.max(day.pct, 4)}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {Math.round(day.value / 60 * 10) / 10}h
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400">{day.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-center text-neutral-400 mt-4 font-medium italic">
                    Your most active study days are usually weekends.
                  </p>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  Recent Activity (Last 7 Days)
                </h3>
                <div className="flex items-end justify-between gap-4 h-32 pt-2">
                  {weekDays.map(day => {
                    const h = (day.minutes / maxMinutes) * 100;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex-1 flex items-end">
                          <div 
                            className={`w-full rounded-t-xl transition-all duration-700 ${day.isToday ? 'bg-primary-500 shadow-glow-primary' : 'bg-neutral-200 dark:bg-neutral-800'}`}
                            style={{ height: `${Math.max(h, day.minutes > 0 ? 8 : 2)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-black ${day.isToday ? 'text-primary-600' : 'text-neutral-400'}`}>{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary-500" />
                  Subject Mastery Matrix
                </h3>
                {subjectStats.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-neutral-400">Add tasks and courses to see analytics</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {subjectStats.map(sub => (
                      <div key={sub.subject} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                            <span className="font-black text-neutral-800 dark:text-neutral-200">{sub.subject}</span>
                          </div>
                          <div className="flex gap-4 font-bold text-neutral-400">
                            <span>{sub.completedTasks}/{sub.totalTasks} Tasks</span>
                            <span className="text-neutral-900 dark:text-white">{Math.round(sub.loggedMinutes / 60 * 10) / 10}h Logged</span>
                          </div>
                        </div>
                        <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden p-0.5">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 shadow-sm"
                            style={{ width: `${sub.completionRate}%`, backgroundColor: sub.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-success-500" />
                  30-Day Activity Heatmap
                </h3>
                <div className="grid grid-cols-10 gap-2">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const d = addDays(new Date(), - (29 - i));
                    const iso = localDateISO(d);
                    const studied = logs.some(l => l.date === iso && l.minutes_studied > 0);
                    return (
                      <div 
                        key={iso}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          studied 
                            ? 'bg-success-500/20 border-success-500/40 scale-105' 
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800'
                        }`}
                        title={iso}
                      />
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-success-500" />
                    <span className="text-neutral-500">Study Session Logged</span>
                  </div>
                  <span className="text-neutral-900 dark:text-white">Consistency: {consistency.consistencyRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}