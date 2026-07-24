import { LayoutDashboard, ListTodo, CalendarDays, Timer, Lightbulb, BookMarked, Bot, Moon, Sun, GraduationCap, UserCircle, LogOut } from 'lucide-react';
import type { View } from '@/App';
import type { Settings } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { NotificationCenter } from '@/components/NotificationCenter';
import type { AppNotification } from '@/lib/notifications';

type Props = {
  view: View;
  setView: (v: View) => void;
  settings: Settings;
  toggleDark: () => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
};

const NAV_ITEMS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
  { id: 'notes', label: 'Notes & AI', icon: BookMarked },
  { id: 'tutor', label: 'AI Tutor', icon: Bot },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
];

export function Sidebar({ view, setView, settings, toggleDark, notifications, setNotifications }: Props) {
  const { profile, user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-screen sticky top-0">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-soft">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-neutral-900 dark:text-white leading-none">Lumora</h1>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">AI Study Planner</p>
          </div>
        </div>
        <NotificationCenter setView={setView} notifications={notifications} setNotifications={setNotifications} />
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-soft'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-primary-600 dark:text-primary-400' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile section */}
      <div className="px-3 pb-2 space-y-1">
        <button
          onClick={() => setView('account')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            view === 'account'
              ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <UserCircle className={`w-[18px] h-[18px] ${view === 'account' ? 'text-primary-600 dark:text-primary-400' : ''}`} />
          Account
        </button>
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        >
          {settings.dark_mode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {settings.dark_mode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {profile?.full_name || 'Student'}
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-error-50 dark:hover:bg-error-950/30 hover:text-error-600 dark:hover:text-error-400 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}