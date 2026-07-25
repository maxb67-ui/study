import { useState, useMemo, useEffect, useCallback } from 'react';
import { Target, Award, CheckCircle2, TrendingUp, Sparkles, ChevronRight, Edit3, X, Save, Clock, BookOpen } from 'lucide-react';
import type { Task, StudyLog, StudyBlock, UserAcademicGoals } from '@/lib/supabase';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { View } from '@/App';
import { DEFAULT_GOALS, mapDbToAcademicGoals, calculateGoalProgress, generateGoalAIRecommendations, type AcademicGoals } from '@/lib/goals';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';

type Props = {
  tasks: Task[];
  logs: StudyLog[];
  blocks: StudyBlock[];
  setView: (v: View) => void;
};

export function GoalTrackerCard({ tasks, logs, blocks, setView }: Props) {
  const { user } = useAuth();
  const toast = useToast();

  const [goals, setGoals] = useState<AcademicGoals>(DEFAULT_GOALS);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(DEFAULT_GOALS.dailyGoalMinutes);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(DEFAULT_GOALS.weeklyGoalHours);
  const [targetGpa, setTargetGpa] = useState(DEFAULT_GOALS.targetGpa);
  const [targetCompletionRate, setTargetCompletionRate] = useState(DEFAULT_GOALS.targetCompletionRate);
  const [targetExamPrepSessions, setTargetExamPrepSessions] = useState(DEFAULT_GOALS.targetExamPrepSessions);

  // Load goals from isolated user_academic_goals table
  const fetchGoals = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('user_academic_goals')
      .select('daily_goal_minutes, weekly_goal_hours, target_gpa, target_completion_rate, target_exam_prep_sessions')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      const parsed = mapDbToAcademicGoals(data as Partial<UserAcademicGoals>);
      setGoals(parsed);
      setDailyGoalMinutes(parsed.dailyGoalMinutes);
      setWeeklyGoalHours(parsed.weeklyGoalHours);
      setTargetGpa(parsed.targetGpa);
      setTargetCompletionRate(parsed.targetCompletionRate);
      setTargetExamPrepSessions(parsed.targetExamPrepSessions);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const progress = calculateGoalProgress(goals, tasks, logs, blocks);
  const recommendations = generateGoalAIRecommendations(goals, progress, tasks);

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      daily_goal_minutes: dailyGoalMinutes,
      weekly_goal_hours: weeklyGoalHours,
      target_gpa: targetGpa,
      target_completion_rate: targetCompletionRate,
      target_exam_prep_sessions: targetExamPrepSessions,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('user_academic_goals')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        toast('error', 'Failed to save academic goals');
        setSaving(false);
        return;
      }
    }

    const nextGoals: AcademicGoals = {
      dailyGoalMinutes,
      weeklyGoalHours,
      targetGpa,
      targetCompletionRate,
      targetExamPrepSessions,
    };
    setGoals(nextGoals);
    setIsEditing(false);
    setSaving(false);
    toast('success', 'Academic goals securely saved!');
  }

  return (
    <div className="card p-6 border-primary-200/60 dark:border-primary-800/40 bg-gradient-to-br from-white via-white to-primary-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-primary-950/20">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-glow-primary">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">Academic Goals & Target Tracker</h3>
            <p className="text-xs text-neutral-400">Track study time, GPA targets, and task completion</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="btn-secondary text-xs px-3 py-1.5 font-bold"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Set Goals
        </button>
      </div>

      {/* Grid of Goal Progress Bars */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* GPA Goal */}
        <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Target GPA</span>
            <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400">{progress.estimatedGpa} / {goals.targetGpa}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${progress.gpaProgressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Est. Performance: {progress.gpaProgressPct}%</span>
        </div>

        {/* Weekly Hours Goal */}
        <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Weekly Hours</span>
            <span className="text-xs font-extrabold text-accent-500">{progress.weekly.currentHours}h / {goals.weeklyGoalHours}h</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progress.weekly.pct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">{progress.weekly.pct}% achieved this week</span>
        </div>

        {/* Task Completion Rate Goal */}
        <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Assignment Rate</span>
            <span className="text-xs font-extrabold text-success-500">{progress.completion.currentRate}% / {goals.targetCompletionRate}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-success-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progress.completion.pct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">{progress.completion.pct}% of target met</span>
        </div>

        {/* Exam Prep Sessions Goal */}
        <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Exam Prep Sessions</span>
            <span className="text-xs font-extrabold text-violet-500">{progress.examPrep.currentSessions} / {goals.targetExamPrepSessions}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
              style={{ width: `${progress.examPrep.pct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">{progress.examPrep.pct}% completed this week</span>
        </div>
      </div>

      {/* AI Goal Action Recommendations */}
      <div>
        <p className="label text-[10px] mb-2.5 flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-accent-500" />
          AI Recommendations to Reach Goals
        </p>
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                    {rec.metricTag}
                  </span>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{rec.title}</p>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">{rec.advice}</p>
              </div>

              <button
                onClick={() => setView(rec.actionView)}
                className="btn-primary text-xs shrink-0 px-3 py-1.5 font-bold"
              >
                Take Action
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Edit Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="card w-full max-w-lg p-6 animate-scale-in space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" /> Set Your Academic Targets
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="label text-[10px]">Daily Study Target: {Math.round(dailyGoalMinutes / 60 * 10) / 10} Hours ({dailyGoalMinutes} min)</label>
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="15"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>

              <div>
                <label className="label text-[10px]">Weekly Study Goal: {weeklyGoalHours} Hours</label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={weeklyGoalHours}
                  onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-[10px]">Target GPA (4.0 Scale)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="4.0"
                    value={targetGpa}
                    onChange={(e) => setTargetGpa(Number(e.target.value))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label text-[10px]">Target Task Completion Rate (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={targetCompletionRate}
                    onChange={(e) => setTargetCompletionRate(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[10px]">Weekly Exam Prep Sessions Target</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={targetExamPrepSessions}
                  onChange={(e) => setTargetExamPrepSessions(Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}