import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, FileText, BookOpen, Calendar, Bot, Trophy, Sparkles, X,
  CheckSquare, Command, ArrowRight, Zap, GraduationCap, Plus, Timer,
} from 'lucide-react';
import type { Task, Note, StudyBlock } from '@/lib/supabase';
import type { View } from '@/App';

type SearchCategory = 'all' | 'tasks' | 'notes' | 'classes' | 'actions';

type SearchResultItem = {
  id: string;
  type: 'task' | 'note' | 'class' | 'action';
  title: string;
  subtitle: string;
  badge?: string;
  icon: typeof Search;
  action: () => void;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setView: (v: View) => void;
  tasks: Task[];
  notes: Note[];
  blocks: StudyBlock[];
  onAddTask: () => void;
  onQuickFocus: () => void;
  startPomodoroForTask: (id: string) => void;
};

export function GlobalSearchModal({
  isOpen,
  onClose,
  setView,
  tasks,
  notes,
  blocks,
  onAddTask,
  onQuickFocus,
  startPomodoroForTask,
}: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // System Actions
    const quickActions: SearchResultItem[] = [
      {
        id: 'act-add-task',
        type: 'action',
        title: 'Add New Task / Assignment',
        subtitle: 'Create homework, project, quiz or exam item',
        icon: Plus,
        badge: 'Action',
        action: () => { onAddTask(); onClose(); },
      },
      {
        id: 'act-focus',
        type: 'action',
        title: 'Start Focus Pomodoro',
        subtitle: 'Launch 25-min study timer',
        icon: Timer,
        badge: 'Action',
        action: () => { onQuickFocus(); onClose(); },
      },
      {
        id: 'act-tutor',
        type: 'action',
        title: 'Ask Lumora AI Tutor',
        subtitle: 'Get grade-level tailored answers & practice problems',
        icon: Bot,
        badge: 'AI',
        action: () => { setView('tutor'); onClose(); },
      },
      {
        id: 'act-calendar',
        type: 'action',
        title: 'View Calendar & AI Schedule',
        subtitle: 'Review scheduled daily study blocks',
        icon: Calendar,
        badge: 'Calendar',
        action: () => { setView('calendar'); onClose(); },
      },
      {
        id: 'act-badges',
        type: 'action',
        title: 'View Achievements & XP',
        subtitle: 'Check daily quests and level badges',
        icon: Trophy,
        badge: 'Rank',
        action: () => { setView('achievements'); onClose(); },
      },
    ];

    if (!q) {
      return quickActions;
    }

    // Index Tasks & Exams
    tasks.forEach((t) => {
      if (
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      ) {
        results.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: `${t.subject} · ${t.type.toUpperCase()} · ${t.completed ? 'Completed' : 'Pending'}`,
          badge: t.type,
          icon: CheckSquare,
          action: () => { setView('tasks'); onClose(); },
        });
      }
    });

    // Index Notes & Content
    notes.forEach((n) => {
      if (
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        results.push({
          id: `note-${n.id}`,
          type: 'note',
          title: n.title || 'Untitled Note',
          subtitle: `${n.subject} · ${n.tags.length > 0 ? `#${n.tags.join(' #')}` : 'Class Note'}`,
          badge: 'Note',
          icon: FileText,
          action: () => { setView('notes'); onClose(); },
        });
      }
    });

    // Index Subjects / Classes
    const allSubjects = new Set([
      ...tasks.map((t) => t.subject),
      ...notes.map((n) => n.subject),
    ]);
    allSubjects.forEach((sub) => {
      if (sub.toLowerCase().includes(q)) {
        results.push({
          id: `class-${sub}`,
          type: 'class',
          title: `Class: ${sub}`,
          subtitle: 'View assignments and notes for this subject',
          badge: 'Subject',
          icon: BookOpen,
          action: () => { setView('tasks'); onClose(); },
        });
      }
    });

    // Filter Quick Actions matching query
    quickActions.forEach((act) => {
      if (act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q)) {
        results.push(act);
      }
    });

    return results;
  }, [query, tasks, notes, onAddTask, onQuickFocus, setView, onClose]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    if (activeCategory === 'tasks') return items.filter((i) => i.type === 'task');
    if (activeCategory === 'notes') return items.filter((i) => i.type === 'note');
    if (activeCategory === 'classes') return items.filter((i) => i.type === 'class');
    if (activeCategory === 'actions') return items.filter((i) => i.type === 'action');
    return items;
  }, [items, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 gap-3 bg-white/90 dark:bg-neutral-900/90">
          <Search className="w-5 h-5 text-primary-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assignments, class notes, subjects, exams, actions..."
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-900 dark:text-white focus:outline-none placeholder-neutral-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-neutral-400">
            <Command className="w-3 h-3" /> ESC
          </span>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 overflow-x-auto no-scrollbar text-xs">
          {(['all', 'tasks', 'notes', 'classes', 'actions'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium capitalize transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Results Container */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No matching items found</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Try searching for keywords like "Calculus", "Physics", "Exam", or "Notes"</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-950/30 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors text-neutral-600 dark:text-neutral-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{item.title}</p>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:bg-primary-100 dark:group-hover:bg-primary-900 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary-500">Lumora Global Search</span>
            <span>·</span>
            <span>{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</span>
          </div>
          <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">Cmd + K</kbd> anytime</span>
        </div>
      </div>
    </div>
  );
}