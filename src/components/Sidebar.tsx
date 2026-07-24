import { LayoutDashboard, ListTodo, CalendarDays, Timer, Lightbulb, BookMarked, Bot, Trophy, Moon, Sun, GraduationCap, UserCircle, LogOut } from 'lucide-react';
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
  { id: 'achievements', label: 'Badges & Level', icon: Trophy },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
];

export function Sidebar({ view, setView, settings, toggleDark, notifications, setNotifications }: Props) {
  const { profile, user, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl h-screen sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 via-primary-600 to-indigo-600 flex items-center justify-center shadow-glow-primary">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-neutral-900 dark:text-white leading-none tracking-tight">Lumora</h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500 mt-0.5">AI Study Hub</p>
          </div>
        </div>
        <NotificationCenter setView={setView} notifications={notifications} setNotifications={setNotifications} />
      </div>

      <nav className="flex-1 px-3.5 py-2 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-glow-primary'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile section */}
      <div className="px-3.5 pb-2 space-y-1">
        <button
          onClick={() => setView('account')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
            view === 'account'
              ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80'
          }`}
        >
          <UserCircle className="w-[18px] h-[18px]" />
          Account
        </button>
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-all"
        >
          {settings.dark_mode ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
          {settings.dark_mode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="p-3.5 border-t border-neutral-200/80 dark:border-neutral-800/80">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-sm">
            {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              {profile?.full_name || 'Student'}
            </p>
            <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:bg-error-50 dark:hover:bg-error-950/40 hover:text-error-600 dark:hover:text-error-400 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}