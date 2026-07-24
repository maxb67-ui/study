import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, type Task, type StudyBlock, type StudyLog } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import { useDarkMode } from '@/lib/useDarkMode';
import { useAuth } from '@/lib/auth';
import { PomodoroProvider, usePomodoro } from '@/lib/usePomodoroContext';
import { PomodoroMiniWidget } from '@/components/PomodoroMiniWidget';
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
import { scanForReminders, getSavedNotifications, type AppNotification } from '@/lib/notifications';

export type View = 'dashboard' | 'tasks' | 'calendar' | 'pomodoro' | 'insights' | 'account';

function AppContent() {
  const { session, profile, loading: authLoading } = useAuth();
  const { settings, update } = useSettings();
  useDarkMode(settings.dark_mode);
  const toast = useToast();
  const pomodoro = usePomodoro();

  const [view, setView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(getSavedNotifications());
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
      if (error) {
        toast('error', 'Failed to load tasks');
        return;
      }
      if (data) setTasks(data as Task[]);
    } catch {}
  }, [toast]);

  const loadBlocks = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('study_blocks').select('*').order('scheduled_date', { ascending: true });
      if (error) {
        toast('error', 'Failed to load schedule');
        return;
      }
      if (data) setBlocks(data as StudyBlock[]);
    } catch {}
  }, [toast]);

  const loadLogs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('study_logs').select('*').order('date', { ascending: true });
      if (error) {
        toast('error', 'Failed to load study history');
        return;
      }
      if (data) setLogs(data as StudyLog[]);
    } catch {}
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

  // Periodically scan for reminders (upcoming exams, tasks due, study blocks)
  useEffect(() => {
    if (loading || !session?.user) return;
    const runScan = () => {
      const updated = scanForReminders(tasks, blocks, settings, toast);
      setNotifications(updated);
    };
    runScan();
    const interval = setInterval(runScan, 60000); // scan every 60 seconds
    return () => clearInterval(interval);
  }, [loading, session, tasks, blocks, settings, toast]);

  function startPomodoroForTask(taskId: string) {
    pomodoro.startPomodoroForTask(taskId);
    setView('pomodoro');
  }

  function addTaskFromDashboard() {
    setView('tasks');
  }

  function startQuickFocus() {
    pomodoro.setPomodoroTaskId(null);
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
    pomodoroTaskId: pomodoro.pomodoroTaskId,
    setPomodoroTaskId: pomodoro.setPomodoroTaskId,
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
      <Sidebar
        view={view}
        setView={setView}
        settings={settings}
        toggleDark={() => update({ dark_mode: !settings.dark_mode })}
        notifications={notifications}
        setNotifications={setNotifications}
      />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <MobileHeader
          settings={settings}
          toggleDark={() => update({ dark_mode: !settings.dark_mode })}
          setView={setView}
          notifications={notifications}
          setNotifications={setNotifications}
        />
        <div key={view} className="page-enter">
          {view === 'dashboard' && <Dashboard {...navProps} />}
          {view === 'tasks' && <TasksView {...navProps} />}
          {view === 'calendar' && <CalendarView {...navProps} />}
          {view === 'pomodoro' && <PomodoroView {...navProps} />}
          {view === 'insights' && <InsightsView {...navProps} />}
          {view === 'account' && <AccountView />}
        </div>
      </main>
      <PomodoroMiniWidget view={view} setView={setView} />
      <MobileNav view={view} setView={setView} />
    </div>
  );
}

function AppInner() {
  const { settings } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);

  const loadTasks = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('tasks').select('*');
    if (data) setTasks(data as Task[]);
  }, []);

  const loadLogs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.from('study_logs').select('*');
    if (data) setLogs(data as StudyLog[]);
  }, []);

  useEffect(() => {
    loadTasks();
    loadLogs();
  }, [loadTasks, loadLogs]);

  return (
    <PomodoroProvider tasks={tasks} settings={settings} onLogAdded={loadLogs}>
      <AppContent />
    </PomodoroProvider>
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