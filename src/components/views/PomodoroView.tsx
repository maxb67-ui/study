import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Check } from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { usePomodoro } from '@/lib/usePomodoroContext';

export function PomodoroView(props: NavProps) {
  const { tasks, settings, loading } = props;
  const {
    mode,
    secondsLeft,
    running,
    completedPomodoros,
    selectedTask,
    toggleRunning,
    reset,
    skip,
    switchMode,
    setPomodoroTaskId,
  } = usePomodoro();

  const focusSeconds = settings.pomodoro_length_minutes * 60;
  const breakSeconds = settings.break_duration_minutes * 60;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalSeconds = mode === 'focus' ? focusSeconds : breakSeconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const svgSize = 300;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="mx-auto w-72 h-72 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Pomodoro Timer" subtitle="Focus deeply, one session at a time" />

      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => switchMode('focus')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            mode === 'focus'
              ? 'bg-primary-500 text-white shadow-soft'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Brain className="w-4 h-4" />
          Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            mode === 'break'
              ? 'bg-success-500 text-white shadow-soft'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Coffee className="w-4 h-4" />
          Break
        </button>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-full max-w-[300px] aspect-square" style={{ maxWidth: svgSize }}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full -rotate-90">
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              strokeWidth={12}
              className="stroke-neutral-200 dark:stroke-neutral-800"
            />
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              strokeWidth={12}
              stroke={mode === 'focus' ? '#3380ff' : '#10b981'}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-bold text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {timeStr}
            </span>
            <span className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
              {mode === 'focus' ? 'Focus Time' : 'Break Time'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-8">
          <div className="flex flex-col items-center gap-2">
            <button onClick={reset} className="btn-secondary w-12 h-12 rounded-2xl flex items-center justify-center" title="Restart Session">
              <RotateCcw className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Restart</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleRunning}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${
                mode === 'focus' ? 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/25' : 'bg-success-500 hover:bg-success-600 shadow-success-500/25'
              }`}
            >
              {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
            <span className="text-[10px] font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              {running ? 'Pause' : 'Resume'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button onClick={skip} className="btn-secondary w-12 h-12 rounded-2xl flex items-center justify-center" title="Skip Session">
              <SkipForward className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Skip</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <p className="label mb-3">Studying For</p>
        {selectedTask ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/20">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{selectedTask.title}</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">{selectedTask.subject}</p>
            </div>
            <button
              onClick={() => setPomodoroTaskId(null)}
              className="btn-ghost text-xs"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {tasks.filter((t) => !t.completed).length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 py-3 text-center">No active tasks. Add one in the Tasks tab.</p>
            ) : (
              tasks.filter((t) => !t.completed).map((t: Task) => (
                <button
                  key={t.id}
                  onClick={() => setPomodoroTaskId(t.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{t.title}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{t.subject}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {completedPomodoros > 0 && (
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-neutral-500 dark:text-neutral-400 animate-scale-in">
          <Check className="w-4 h-4 text-success-500" />
          {completedPomodoros} Pomodoro{completedPomodoros !== 1 ? 's' : ''} completed this session
        </div>
      )}
    </div>
  );
}