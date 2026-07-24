import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Check } from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { localDateISO } from '@/lib/dates';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

type Mode = 'focus' | 'break';

export function PomodoroView(props: NavProps) {
  const { tasks, settings, pomodoroTaskId, setPomodoroTaskId, onLogAdded, loading } = props;
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(settings.pomodoro_length_minutes * 60);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<Mode>(mode);
  const runningRef = useRef<boolean>(running);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { runningRef.current = running; }, [running]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === pomodoroTaskId) ?? null;
  }, [tasks, pomodoroTaskId]);

  const focusSeconds = settings.pomodoro_length_minutes * 60;
  const breakSeconds = settings.break_duration_minutes * 60;

  useEffect(() => {
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
  }, [mode, focusSeconds, breakSeconds]);

  const logSession = useCallback(async () => {
    const today = localDateISO(new Date());
    const minutes = settings.pomodoro_length_minutes;

    const { data: existing } = await supabase
      .from('study_logs')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('study_logs')
        .update({
          minutes_studied: (existing as { minutes_studied: number }).minutes_studied + minutes,
          pomodoro_count: (existing as { pomodoro_count: number }).pomodoro_count + 1,
        })
        .eq('id', (existing as { id: string }).id);
      if (error) {
        toast('error', 'Failed to log study session');
        return;
      }
    } else {
      const { error } = await supabase.from('study_logs').insert({
        task_id: pomodoroTaskId,
        date: today,
        minutes_studied: minutes,
        pomodoro_count: 1,
      });
      if (error) {
        toast('error', 'Failed to log study session');
        return;
      }
    }

    setCompletedPomodoros((c) => c + 1);
    onLogAdded();
    toast('success', `Pomodoro complete! ${minutes} minutes logged.`);
  }, [settings.pomodoro_length_minutes, pomodoroTaskId, onLogAdded, toast]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Handle timer reaching zero — separate effect avoids side effects in state updater
  useEffect(() => {
    if (secondsLeft !== 0 || !running) return;
    const wasFocus = modeRef.current;
    setRunning(false);
    if (wasFocus) {
      logSession();
    }
    setMode(wasFocus ? 'break' : 'focus');
  }, [secondsLeft, running, logSession]);

  function toggleRunning() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
  }

  function skip() {
    const wasFocus = mode;
    if (wasFocus && running) {
      logSession();
    }
    setMode(wasFocus ? 'break' : 'focus');
    setRunning(false);
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setRunning(false);
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const totalSeconds = mode === 'focus' ? focusSeconds : breakSeconds;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

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

        <div className="flex items-center gap-3 mt-6">
          <button onClick={reset} className="btn-secondary p-3" title="Reset">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleRunning}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-soft transition-all active:scale-95 ${
              mode === 'focus' ? 'bg-primary-500 hover:bg-primary-600' : 'bg-success-500 hover:bg-success-600'
            }`}
          >
            {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button onClick={skip} className="btn-secondary p-3" title="Skip">
            <SkipForward className="w-5 h-5" />
          </button>
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
