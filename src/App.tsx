"use client";

import { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MobileNav } from './components/MobileNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { PomodoroMiniWidget } from './components/PomodoroMiniWidget';
import { ViewSkeleton, SpinnerFallback } from './components/LoadingFallback';
import { AuthPage } from './components/views/AuthPage';
import { OnboardingView } from './components/views/OnboardingView';
import { useAuth } from './lib/auth';
import { useSettings } from './lib/useSettings';
import { useDarkMode } from './lib/useDarkMode';
import { PomodoroProvider, usePomodoro } from './lib/usePomodoroContext';
import { supabase, type Task, type StudyBlock, type StudyLog, type Note, type NoteInput, type Course } from './lib/supabase';
import { useToast } from './components/Toast';
import { scanForReminders, type AppNotification } from './lib/notifications';

const Dashboard = lazy(() => import('./components/views/Dashboard').then(m => ({ default: m.Dashboard })));
const TasksView = lazy(() => import('./components/views/TasksView').then(m => ({ default: m.TasksView })));
const CalendarView = lazy(() => import('./components/views/CalendarView').then(m => ({ default: m.CalendarView })));
const PomodoroView = lazy(() => import('./components/views/PomodoroView').then(m => ({ default: m.PomodoroView })));
const NotesView = lazy(() => import('./components/views/NotesView').then(m => ({ default: m.NotesView })));
const TutorView = lazy(() => import('./components/views/TutorView').then(m => ({ default: m.TutorView })));
const AchievementsView = lazy(() => import('./components/views/AchievementsView').then(m => ({ default: m.AchievementsView })));
const InsightsView = lazy(() => import('./components/views/InsightsView').then(m => ({ default: m.InsightsView })));
const AccountView = lazy(() => import('./components/views/AccountView').then(m => ({ default: m.AccountView })));
const CoursesView = lazy(() => import('./components/views/CoursesView').then(m => ({ default: m.CoursesView })));

export type View = 'dashboard' | 'tasks' | 'calendar' | 'pomodoro' | 'notes' | 'tutor' | 'achievements' | 'insights' | 'account' | 'courses';

function AppContent() {
  const { user, profile, loading: authLoading, isDemo } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const toast = useToast();
  
  const [view, setView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const { startPomodoroForTask } = usePomodoro();

  useDarkMode(settings.dark_mode);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const [
      { data: tasksData },
      { data: blocksData },
      { data: logsData },
      { data: notesData },
      { data: coursesData }
    ] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
      supabase.from('study_blocks').select('*').eq('user_id', user.id).order('scheduled_date', { ascending: true }),
      supabase.from('study_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('courses').select('*').eq('user_id', user.id).order('name', { ascending: true })
    ]);

    if (tasksData) setTasks(tasksData);
    if (blocksData) setBlocks(blocksData);
    if (logsData) setLogs(logsData);
    if (notesData) setNotes(notesData);
    if (coursesData) setCourses(coursesData);
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && (profile?.onboarded || isDemo)) {
      fetchData();
    }
  }, [user, profile?.onboarded, isDemo, fetchData]);

  const handleSaveNote = async (input: NoteInput, id?: string) => {
    if (!user) return;
    if (id) {
      await supabase.from('notes').update(input).eq('id', id).eq('user_id', user.id);
    } else {
      await supabase.from('notes').insert({ ...input, user_id: user.id });
    }
    fetchData();
  };

  const navProps = {
    view, setView, tasks, blocks, logs, notes, courses, settings, updateSettings,
    pomodoroTaskId: null,
    setPomodoroTaskId: () => {},
    startPomodoroForTask,
    onAddTask: () => setView('tasks'),
    onQuickFocus: () => setView('pomodoro'),
    onBlocksGenerated: fetchData,
    onLogAdded: fetchData,
    reloadTasks: fetchData,
    reloadBlocks: fetchData,
    reloadNotes: fetchData,
    reloadCourses: fetchData,
    onSaveNote: handleSaveNote,
    onDeleteNote: async (id: string) => { 
      if(user) await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id); 
      fetchData(); 
    },
    loading: loading || authLoading
  };

  if (authLoading) return <SpinnerFallback message="Initializing Lumora..." />;
  if (!user) return <AuthPage />;
  if (!profile?.onboarded) return <OnboardingView />;

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Sidebar 
        view={view} setView={setView} settings={settings} 
        toggleDark={() => updateSettings({ dark_mode: !settings.dark_mode })}
        notifications={notifications} setNotifications={setNotifications}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <MobileHeader 
          settings={settings} toggleDark={() => updateSettings({ dark_mode: !settings.dark_mode })}
          setView={setView} notifications={notifications} setNotifications={setNotifications}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<ViewSkeleton />}>
            {view === 'dashboard' && <Dashboard {...navProps} />}
            {view === 'tasks' && <TasksView {...navProps} />}
            {view === 'calendar' && <CalendarView {...navProps} />}
            {view === 'pomodoro' && <PomodoroView {...navProps} />}
            {view === 'notes' && <NotesView {...navProps} />}
            {view === 'tutor' && <TutorView {...navProps} />}
            {view === 'achievements' && <AchievementsView {...navProps} />}
            {view === 'insights' && <InsightsView {...navProps} />}
            {view === 'courses' && <CoursesView {...navProps} />}
            {view === 'account' && <AccountView />}
          </Suspense>
        </main>
        <MobileNav view={view} setView={setView} />
        <PomodoroMiniWidget view={view} setView={setView} />
      </div>
      <GlobalSearchModal 
        isOpen={searchOpen} onClose={() => setSearchOpen(false)} setView={setView}
        tasks={tasks} notes={notes} blocks={blocks}
        onAddTask={() => { setView('tasks'); setSearchOpen(false); }}
        onQuickFocus={() => { setView('pomodoro'); setSearchOpen(false); }}
        startPomodoroForTask={(id) => { startPomodoroForTask(id); setSearchOpen(false); }}
      />
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user) {
      supabase.from('tasks').select('*').eq('user_id', user.id).then(({ data }) => { 
        if (data) setTasks(data); 
      });
    }
  }, [user]);

  return (
    <PomodoroProvider tasks={tasks} settings={settings} onLogAdded={() => {}}>
      <AppContent />
    </PomodoroProvider>
  );
}