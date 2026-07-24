import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import type { Task, Settings } from './supabase';
import { supabase } from './supabase';
import { localDateISO } from './dates';
import { useToast } from '@/components/Toast';

export type PomodoroMode = 'focus' | 'break';

type PomodoroContextValue = {
  mode: PomodoroMode;
  secondsLeft: number;
  running: boolean;
  pomodoroTaskId: string | null;
  completedPomodoros: number;
  selectedTask: Task | null;
  toggleRunning: () => void;
  reset: () => void;
  skip: () => void;
  switchMode: (newMode: PomodoroMode) => void;
  setPomodoroTaskId: (id: string | null) => void;
  startPomodoroForTask: (taskId: string) => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({
  children,
  tasks,
  settings,
  onLogAdded,
}: {
  children: ReactNode;
  tasks: Task[];
  settings: Settings;
  onLogAdded: () => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [running, setRunning] = useState(false);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const focusSeconds = settings.pomodoro_length_minutes * 60;
  const breakSeconds = settings.break_duration_minutes * 60;

  const [secondsLeft, setSecondsLeft] = useState(focusSeconds);

  const modeRef = useRef<PomodoroMode>(mode);
  const runningRef = useRef<boolean>(running);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    if (!running) {
      setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
    }
  }, [mode, focusSeconds, breakSeconds, running]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === pomodoroTaskId) ?? null;
  }, [tasks, pomodoroTaskId]);

  const logSession = useCallback(async () => {
    const today = localDateISO(new Date());
    const minutes = settings.pomodoro_length_minutes;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { data: existing } = await supabase
          .from('study_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('study_logs')
            .update({
              minutes_studied: (existing as { minutes_studied: number }).minutes_studied + minutes,
              pomodoro_count: (existing as { pomodoro_count: number }).pomodoro_count + 1,
            })
            .eq('id', (existing as { id: string }).id)
            .eq('user_id', userId);
        } else {
          await supabase.from('study_logs').insert({
            user_id: userId,
            task_id: pomodoroTaskId,
            date: today,
            minutes_studied: minutes,
            pomodoro_count: 1,
          });
        }
      }
    } catch {
      // Local fallback
    }

    setCompletedPomodoros((c) => c + 1);
    onLogAdded();
    toast('success', `🎉 Pomodoro complete! ${minutes} minutes logged.`);
  }, [settings.pomodoro_length_minutes, pomodoroTaskId, onLogAdded, toast]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (secondsLeft !== 0 || !running) return;
    const wasFocus = modeRef.current;
    setRunning(false);

    if (wasFocus) {
      logSession();
    }
    const nextMode = wasFocus ? 'break' : 'focus';
    setMode(nextMode);
    setSecondsLeft(nextMode === 'focus' ? focusSeconds : breakSeconds);
  }, [secondsLeft, running, logSession, focusSeconds, breakSeconds]);

  const toggleRunning = useCallback(() => setRunning((r) => !r), []);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(mode === 'focus' ? focusSeconds : breakSeconds);
  }, [mode, focusSeconds, breakSeconds]);

  const skip = useCallback(() => {
    const wasFocus = mode;
    if (wasFocus && running) {
      logSession();
    }
    const nextMode = wasFocus ? 'break' : 'focus';
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(nextMode === 'focus' ? focusSeconds : breakSeconds);
  }, [mode, running, logSession, focusSeconds, breakSeconds]);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setMode(newMode);
    setRunning(false);
    setSecondsLeft(newMode === 'focus' ? focusSeconds : breakSeconds);
  }, [focusSeconds, breakSeconds]);

  const startPomodoroForTask = useCallback((taskId: string) => {
    setPomodoroTaskId(taskId);
    setMode('focus');
    setSecondsLeft(focusSeconds);
    setRunning(true);
  }, [focusSeconds]);

  const value = {
    mode,
    secondsLeft,
    running,
    pomodoroTaskId,
    completedPomodoros,
    selectedTask,
    toggleRunning,
    reset,
    skip,
    switchMode,
    setPomodoroTaskId,
    startPomodoroForTask,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
}