import { LayoutDashboard, ListTodo, CalendarDays, Timer, BookMarked, Bot, Trophy, Lightbulb, UserCircle } from 'lucide-react';
import type { View } from '@/App';

type Props = {
  view: View;
  setView: (v: View) => void;
};

const NAV_ITEMS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'notes', label: 'Notes', icon: BookMarked },
  { id: 'tutor', label: 'Tutor', icon: Bot },
  { id: 'achievements', label: 'Badges', icon: Trophy },
  { id: 'pomodoro', label: 'Focus', icon: Timer },
  { id: 'account', label: 'Account', icon: UserCircle },
];

export function MobileNav({ view, setView }: Props) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-1 py-1.5">
      <div className="flex items-center justify-around overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all shrink-0 ${
                active ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}