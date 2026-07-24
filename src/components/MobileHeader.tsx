import { Moon, Sun, GraduationCap, LogOut } from 'lucide-react';
import type { Settings } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Props = {
  settings: Settings;
  toggleDark: () => void;
};

export function MobileHeader({ settings, toggleDark }: Props) {
  const { profile, user, signOut } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-neutral-900 dark:text-white">Lumora</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleDark}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        >
          {settings.dark_mode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <button
          onClick={signOut}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
