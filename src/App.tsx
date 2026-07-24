import { useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ViewSkeleton, SpinnerFallback } from './components/LoadingFallback';
import { useAuth } from './lib/auth';
import type { Note, NoteInput } from './lib/supabase';

// Lazy-loaded route views for code splitting
const DashboardView = lazy(() =>
  import('./components/views/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const NotesView = lazy(() =>
  import('./components/views/NotesView').then((m) => ({ default: m.NotesView }))
);
const TutorView = lazy(() =>
  import('./components/views/TutorView').then((m) => ({ default: m.TutorView }))
);
const TasksView = lazy(() =>
  import('./components/views/TasksView').then((m) => ({ default: m.TasksView }))
);
const AccountView = lazy(() =>
  import('./components/views/AccountView').then((m) => ({ default: m.AccountView }))
);

export type ViewType = 'dashboard' | 'notes' | 'tutor' | 'tasks' | 'account';

export default function App() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);

  // Sample placeholder state management
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const handleSaveNote = useCallback((input: NoteInput, id?: string) => {
    if (id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...input, updated_at: new Date().toISOString() } : n
        )
      );
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        user_id: user?.id || 'demo-user',
        title: input.title,
        subject: input.subject,
        content: input.content,
        tags: input.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
  }, [user?.id]);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const navProps = useMemo(() => ({
    notes,
    onSaveNote: handleSaveNote,
    onDeleteNote: handleDeleteNote,
    loading: notesLoading,
    setView: setActiveView,
  }), [notes, handleSaveNote, handleDeleteNote, notesLoading]);

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);

  if (authLoading) {
    return <SpinnerFallback message="Initializing Lumora..." />;
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setView={setActiveView}
        onOpenSearch={handleOpenSearch}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader
          activeView={activeView}
          setView={setActiveView}
          onOpenSearch={handleOpenSearch}
        />

        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<ViewSkeleton />}>
            {activeView === 'dashboard' && <DashboardView {...navProps} />}
            {activeView === 'notes' && <NotesView {...navProps} />}
            {activeView === 'tutor' && <TutorView {...navProps} />}
            {activeView === 'tasks' && <TasksView {...navProps} />}
            {activeView === 'account' && <AccountView />}
          </Suspense>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={handleCloseSearch}
        notes={notes}
        setView={setActiveView}
      />
    </div>
  );
}