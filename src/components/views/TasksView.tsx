import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, BookOpen, FileText, CalendarClock, Check, Zap,
  AlertTriangle, ClipboardList, FlaskConical, FolderKanban, ChevronDown,
  CheckCircle2, Clock, ListTodo, Filter, X, ArrowDownUp,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task, TaskInput } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { localDateISO, daysBetween } from '@/lib/dates';
import { PageHeader } from '@/components/PageHeader';
import { TaskModal } from '@/components/TaskModal';
import { useToast } from '@/components/Toast';

const TYPE_ICONS: Record<Task['type'], typeof FileText> = {
  homework: ClipboardList,
  assignment: FileText,
  project: FolderKanban,
  quiz: FlaskConical,
  exam: BookOpen,
  deadline: CalendarClock,
};

const TYPE_COLORS: Record<Task['type'], string> = {
  homework: 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400',
  assignment: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400',
  project: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
  quiz: 'bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400',
  exam: 'bg-accent-50 dark:bg-accent-950/30 text-accent-600 dark:text-accent-400',
  deadline: 'bg-error-50 dark:bg-error-950/30 text-error-600 dark:text-error-400',
};

const TYPE_LABELS: Record<Task['type'], string> = {
  homework: 'Homework',
  assignment: 'Assignment',
  project: 'Project',
  quiz: 'Quiz',
  exam: 'Exam',
  deadline: 'Deadline',
};

type SortKey = 'dueDate' | 'priority' | 'created' | 'estimated';
type StatusFilter = 'all' | 'active' | 'completed' | 'overdue';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-neutral-400',
  2: 'text-neutral-400',
  3: 'text-primary-500',
  4: 'text-accent-500',
  5: 'text-error-500',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Urgent',
};

export function TasksView(props: NavProps) {
  const { tasks, reloadTasks, startPomodoroForTask, loading } = props;
  const { profile } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const subjects = useMemo(() => {
    const profileClasses = profile?.classes ?? [];
    const taskSubjects = tasks.map((t) => t.subject);
    return [...new Set([...profileClasses, ...taskSubjects])].sort();
  }, [profile, tasks]);

  const filtered = useMemo(() => {
    let result = [...tasks];

    if (statusFilter === 'active') result = result.filter((t) => !t.completed);
    else if (statusFilter === 'completed') result = result.filter((t) => t.completed);
    else if (statusFilter === 'overdue') {
      const today = localDateISO(new Date());
      result = result.filter((t) => !t.completed && t.due_date < today);
    }

    if (subjectFilter !== 'all') result = result.filter((t) => t.subject === subjectFilter);

    result.sort((a, b) => {
      switch (sortKey) {
        case 'dueDate':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          return b.priority - a.priority;
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'estimated':
          return b.estimated_hours - a.estimated_hours;
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, statusFilter, subjectFilter, sortKey]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const today = localDateISO(new Date());
    const overdue = tasks.filter((t) => !t.completed && t.due_date < today).length;
    const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
    return { total, completed, active, overdue, totalHours };
  }, [tasks]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const task of filtered) {
      const key = task.subject;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  async function toggleComplete(task: Task) {
    const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (error) {
      toast('error', 'Failed to update task');
      return;
    }
    reloadTasks();
    toast('success', task.completed ? 'Marked as incomplete' : 'Task completed!');
  }

  async function deleteTask(id: string) {
    const { error: blockError } = await supabase.from('study_blocks').delete().eq('task_id', id);
    if (blockError) {
      toast('error', 'Failed to remove study sessions');
      return;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast('error', 'Failed to delete task');
      return;
    }
    reloadTasks();
    setDeleteConfirm(null);
    toast('success', 'Task deleted');
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setModalOpen(true);
  }

  async function saveTask(data: TaskInput, id?: string) {
    setSaving(true);
    if (id) {
      const { error } = await supabase.from('tasks').update(data).eq('id', id);
      if (error) {
        toast('error', 'Failed to update task');
        setSaving(false);
        return;
      }
      toast('success', 'Task updated');
    } else {
      const { error } = await supabase.from('tasks').insert({ ...data, completed: false });
      if (error) {
        toast('error', 'Failed to add task');
        setSaving(false);
        return;
      }
      toast('success', 'Task added — generate a new schedule to include it');
    }
    reloadTasks();
    setModalOpen(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = statusFilter !== 'all' || subjectFilter !== 'all';

  return (
    <div className="max-w-4xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Tasks"
        subtitle="Homework, projects, quizzes, exams & deadlines"
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        }
      />

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatChip icon={ListTodo} value={stats.active} label="Active" color="text-primary-500" bg="bg-primary-50 dark:bg-primary-950/30" />
        <StatChip icon={CheckCircle2} value={stats.completed} label="Completed" color="text-success-500" bg="bg-success-50 dark:bg-success-950/30" />
        <StatChip icon={AlertTriangle} value={stats.overdue} label="Overdue" color="text-error-500" bg="bg-error-50 dark:bg-error-950/30" />
        <StatChip icon={Clock} value={`${Math.round(stats.totalHours)}h`} label="Total Est." color="text-accent-500" bg="bg-accent-50 dark:bg-accent-950/30" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1.5 flex-1 min-w-0">
          {(['all', 'active', 'completed', 'overdue'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all whitespace-nowrap ${
                statusFilter === f
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn text-xs px-3 py-1.5 gap-1.5 transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
        </button>

        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-medium rounded-full pl-3 pr-8 py-1.5 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none"
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="created">Sort: Newest</option>
            <option value="estimated">Sort: Est. Time</option>
          </select>
          <ArrowDownUp className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="card p-4 mb-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Subject</span>
            {hasActiveFilters && (
              <button
                onClick={() => { setSubjectFilter('all'); setStatusFilter('all'); }}
                className="text-xs text-primary-500 font-medium flex items-center gap-1 hover:text-primary-600 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                subjectFilter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubjectFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  subjectFilter === s
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
            {hasActiveFilters ? 'Try adjusting or clearing your filters' : 'Add your first assignment or exam to get started'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={() => { setSubjectFilter('all'); setStatusFilter('all'); }}
              className="btn-secondary mx-auto"
            >
              Clear Filters
            </button>
          ) : (
            <button onClick={openAdd} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([subject, subjectTasks]) => (
            <div key={subject}>
              {/* Subject group header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{subject}</h3>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{subjectTasks.length}</span>
              </div>
              <div className="space-y-2">
                {subjectTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleComplete}
                    onEdit={openEdit}
                    onDelete={setDeleteConfirm}
                    onStartPomodoro={startPomodoroForTask}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TaskModal
          task={editing}
          onSave={saveTask}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card w-full max-w-sm p-6 mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-error-50 dark:bg-error-950/30 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-error-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-1">Delete Task?</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-5">
              "{deleteConfirm.title}" and its study sessions will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => deleteTask(deleteConfirm.id)}
                className="btn flex-1 bg-error-500 text-white hover:bg-error-600 px-4 py-2.5 text-sm shadow-soft"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task, onToggle, onEdit, onDelete, onStartPomodoro,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStartPomodoro: (id: string) => void;
}) {
  const Icon = TYPE_ICONS[task.type];
  const daysLeft = daysBetween(new Date(), new Date(task.due_date));
  const isOverdue = daysLeft < 0 && !task.completed;
  const isDueSoon = daysLeft <= 2 && daysLeft >= 0 && !task.completed;

  return (
    <div
      className={`card p-4 flex items-center gap-3 group animate-slide-up ${task.completed ? 'opacity-60' : ''} ${
        isOverdue ? 'border-l-4 border-l-error-400' : isDueSoon ? 'border-l-4 border-l-accent-400' : ''
      }`}
    >
      <button
        onClick={() => onToggle(task)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          task.completed
            ? 'bg-success-500 border-success-500'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-success-400'
        }`}
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[task.type]}`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.completed ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-900 dark:text-white'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 flex-wrap">
          <span className="capitalize">{TYPE_LABELS[task.type]}</span>
          <span>·</span>
          <span>{task.estimated_hours}h est.</span>
          <span>·</span>
          <span className={PRIORITY_COLORS[task.priority]}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span>·</span>
          <span className={`${isOverdue ? 'text-error-500 font-medium' : isDueSoon ? 'text-accent-500 font-medium' : ''}`}>
            {isOverdue
              ? `${Math.abs(daysLeft)}d overdue`
              : daysLeft === 0
                ? 'Due today'
                : daysLeft === 1
                  ? '1 day left'
                  : `${daysLeft} days left`}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-0.5" title={`Difficulty: ${task.difficulty}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i < task.difficulty ? 'bg-accent-400' : 'bg-neutral-200 dark:bg-neutral-700'}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {!task.completed && (
          <button
            onClick={() => onStartPomodoro(task.id)}
            className="btn-ghost p-2 text-primary-500"
            title="Start Pomodoro"
          >
            <Zap className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => onEdit(task)} className="btn-ghost p-2" title="Edit">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(task)} className="btn-ghost p-2 text-error-500" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon, value, label, color, bg,
}: {
  icon: typeof Clock;
  value: string | number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="card p-3 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-neutral-900 dark:text-white leading-none">{value}</p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}
