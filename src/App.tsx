import { useEffect, useState, useCallback } from 'react';
import { supabase, type Task, type StudyBlock, type StudyLog } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { useDarkMode } from '@/lib/useDarkMode';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/views/Dashboard';
import { TasksView } from '@/components/views/TasksView';
import { CalendarView } from '@/components/views/CalendarView';
import { PomodoroView } from '@/components/views/PomodoroView';
import { InsightsView } from '@/components/views/InsightsView';
import { AccountView } from '@/components/views/AccountView';
import { AuthPage } from '@/components/views/AuthPage';
import { OnboardingView } from '@/components/views/OnboardingView';
import { MobileNav } from '@/components/MobileNav';
import { MobileHeader } from '@/components/MobileHeader';
import { ToastProvider, useToast } from '@/components/Toast';

export type View = 'dashboard' | 'tasks' | 'calendar' | 'pomodoro' | 'insights' | 'account';

function AppInner() {
  const { session, profile, loading: authLoading } = useAuth();
  const { settings, update } = useSettings();
  useDarkMode(settings.dark_mode);
  const toast = useToast();

  const [view, setView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
    if (error) {
      toast('error', 'Failed to load tasks');
      return;
    }
    setTasks(data as Task[]);
  }, [toast]);

  const loadBlocks = useCallback(async () => {
    const { data, error } = await supabase.from('study_blocks').select('*').order('scheduled_date', { ascending: true });
    if (error) {
      toast('error', 'Failed to load schedule');
      return;
    }
    setBlocks(data as StudyBlock[]);
  }, [toast]);

  const loadLogs = useCallback(async () => {
    const { data, error } = await supabase.from('study_logs').select('*').order('date', { ascending: true });
    if (error) {
      toast('error', 'Failed to load study history');
      return;
    }
    setLogs(data as StudyLog[]);
  }, [toast]);

  useEffect(() => {
    if (!session?.user) {
      setTasks([]);
      setBlocks([]);
      setLogs([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      await Promise.all([loadTasks(), loadBlocks(), loadLogs()]);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [session, loadTasks, loadBlocks, loadLogs]);

  function startPomodoroForTask(taskId: string) {
    setPomodoroTaskId(taskId);
    setView('pomodoro');
  }

  function addTaskFromDashboard() {
    setView('tasks');
  }

  function startQuickFocus() {
    setPomodoroTaskId(null);
    setView('pomodoro');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (profile && !profile.onboarded) {
    return <OnboardingView />;
  }

  const navProps = {
    view,
    setView,
    tasks,
    blocks,
    settings,
    updateSettings: update,
    pomodoroTaskId,
    setPomodoroTaskId,
    startPomodoroForTask,
    onAddTask: addTaskFromDashboard,
    onQuickFocus: startQuickFocus,
    onBlocksGenerated: loadBlocks,
    onLogAdded: loadLogs,
    reloadTasks: loadTasks,
    reloadBlocks: loadBlocks,
    logs,
    loading,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <Sidebar view={view} setView={setView} settings={settings} toggleDark={() => update({ dark_mode: !settings.dark_mode })} />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <MobileHeader settings={settings} toggleDark={() => update({ dark_mode: !settings.dark_mode })} />
        <div key={view} className="page-enter">
          {view === 'dashboard' && <Dashboard {...navProps} />}
          {view === 'tasks' && <TasksView {...navProps} />}
          {view === 'calendar' && <CalendarView {...navProps} />}
          {view === 'pomodoro' && <PomodoroView {...navProps} />}
          {view === 'insights' && <InsightsView {...navProps} />}
          {view === 'account' && <AccountView />}
        </div>
      </main>
      <MobileNav view={view} setView={setView} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;
