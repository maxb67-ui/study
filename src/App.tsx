import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, type Task, type StudyBlock, type StudyLog, type Note, type NoteInput } from '@/lib/supabase';
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
import { NotesView } from '@/components/views/NotesView';
import { TutorView } from '@/components/views/TutorView';
import { AchievementsView } from '@/components/views/AchievementsView';
import { AccountView } from '@/components/views/AccountView';
import { AuthPage } from '@/components/views/AuthPage';
import { OnboardingView } from '@/components/views/OnboardingView';
import { MobileNav } from '@/components/MobileNav';
import { MobileHeader } from '@/components/MobileHeader';
import { ToastProvider, useToast } from '@/components/Toast';
import { scanForReminders, getSavedNotifications, type AppNotification } from '@/lib/notifications';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

export type View = 'dashboard' | 'tasks' | 'calendar' | 'pomodoro' | 'notes' | 'tutor' | 'achievements' | 'insights' | 'account';

const LOCAL_NOTES_KEY = 'lumora_local_notes_v1';

export function AppContent() {
  const { session, profile, loading: authLoading } = useAuth();
  const { settings, update } = useSettings();
  useDarkMode(settings.dark_mode);
  const toast = useToast();
  const pomodoro = usePomodoro();

  const [view, setView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(getSavedNotifications());
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTasks = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('due_date', { ascending: true });
      if (!error && data) setTasks(data as Task[]);
    } catch {}
  }, [session]);

  const loadBlocks = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('study_blocks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('scheduled_date', { ascending: true });
      if (!error && data) setBlocks(data as StudyBlock[]);
    } catch {}
  }, [session]);

  const loadLogs = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });
      if (!error && data) setLogs(data as StudyLog[]);
    } catch {}
  }, [session]);

  const loadNotes = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user?.id) {
      try {
        const saved = localStorage.getItem(LOCAL_NOTES_KEY);
        if (saved) setNotes(JSON.parse(saved));
      } catch {}
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });
      if (!error && data) setNotes(data as Note[]);
      else {
        const saved = localStorage.getItem(LOCAL_NOTES_KEY);
        if (saved) setNotes(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem(LOCAL_NOTES_KEY);
      if (saved) setNotes(JSON.parse(saved));
    }
  }, [session]);

  const handleSaveNote = useCallback(async (input: NoteInput, id?: string) => {
    const now = new Date().toISOString();
    let updatedNotes: Note[] = [];

    if (id) {
      updatedNotes = notes.map((n) => (n.id === id ? { ...n, ...input, updated_at: now } : n));
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        user_id: session?.user?.id || 'demo',
        ...input,
        created_at: now,
        updated_at: now,
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(updatedNotes));

    if (isSupabaseConfigured && session?.user?.id) {
      try {
        if (id) {
          await supabase
            .from('notes')
            .update({ ...input, updated_at: now })
            .eq('id', id)
            .eq('user_id', session.user.id);
        } else {
          await supabase
            .from('notes')
            .insert({ ...input, user_id: session.user.id });
        }
      } catch {}
    }
    toast('success', id ? 'Note updated' : 'Note created');
  }, [notes, session, toast]);

  const handleDeleteNote = useCallback(async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && session?.user?.id) {
      try {
        await supabase
          .from('notes')
          .delete()
          .eq('id', id)
          .eq('user_id', session.user.id);
      } catch {}
    }
    toast('success', 'Note deleted');
  }, [notes, session, toast]);

  useEffect(() => {
    if (!session?.user) {
      setTasks([]);
      setBlocks([]);
      setLogs([]);
      setNotes([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      await Promise.all([loadTasks(), loadBlocks(), loadLogs(), loadNotes()]);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [session, loadTasks, loadBlocks, loadLogs, loadNotes]);

  useEffect(() => {
    if (loading || !session?.user) return;
    const runScan = () => {
      const updated = scanForReminders(tasks, blocks, settings, toast);
      setNotifications(updated);
    };
    runScan();
    const interval = setInterval(runScan, 60000);
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
    logs,
    notes,
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
    reloadNotes: loadNotes,
    onSaveNote: handleSaveNote,
    onDeleteNote: handleDeleteNote,
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
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <MobileHeader
          settings={settings}
          toggleDark={() => update({ dark_mode: !settings.dark_mode })}
          setView={setView}
          notifications={notifications}
          setNotifications={setNotifications}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <div key={view} className="page-enter">
          {view === 'dashboard' && <Dashboard {...navProps} />}
          {view === 'tasks' && <TasksView {...navProps} />}
          {view === 'calendar' && <CalendarView {...navProps} />}
          {view === 'pomodoro' && <PomodoroView {...navProps} />}
          {view === 'notes' && <NotesView {...navProps} />}
          {view === 'tutor' && <TutorView {...navProps} />}
          {view === 'achievements' && <AchievementsView {...navProps} />}
          {view === 'insights' && <InsightsView {...navProps} />}
          {view === 'account' && <AccountView />}
        </div>
      </main>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        setView={setView}
        tasks={tasks}
        notes={notes}
        blocks={blocks}
        onAddTask={addTaskFromDashboard}
        onQuickFocus={startQuickFocus}
        startPomodoroForTask={startPomodoroForTask}
      />

      <PomodoroMiniWidget view={view} setView={setView} />
      <MobileNav view={view} setView={setView} />
    </div>
  );
}

function AppInner() {
  const { settings } = useSettings();
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    const { data } = await supabase.from('tasks').select('*').eq('user_id', session.user.id);
    if (data) setTasks(data as Task[]);
  }, [session]);

  const loadLogs = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    await supabase.from('study_logs').select('*').eq('user_id', session.user.id);
  }, [session]);

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