import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, BookOpen, FileText, CalendarClock, ClipboardList, FlaskConical, FolderKanban } from 'lucide-react';
import type { Task, TaskInput } from '@/lib/supabase';
import { localDateTimeISO } from '@/lib/dates';
import { useAuth } from '@/lib/auth';

type Props = {
  task: Task | null;
  onSave: (data: TaskInput, id?: string) => void;
  onClose: () => void;
  saving?: boolean;
};

const TYPES = [
  { value: 'homework', label: 'Homework', icon: ClipboardList },
  { value: 'assignment', label: 'Assignment', icon: FileText },
  { value: 'project', label: 'Project', icon: FolderKanban },
  { value: 'quiz', label: 'Quiz', icon: FlaskConical },
  { value: 'exam', label: 'Exam', icon: BookOpen },
  { value: 'deadline', label: 'Deadline', icon: CalendarClock },
] as const;

export function TaskModal({ task, onSave, onClose, saving }: Props) {
  const { profile } = useAuth();
  const [title, setTitle] = useState(task?.title ?? '');
  const [type, setType] = useState<TaskInput['type']>(task?.type ?? 'assignment');
  const [subject, setSubject] = useState(task?.subject ?? '');
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [difficulty, setDifficulty] = useState(task?.difficulty ?? 3);
  const [priority, setPriority] = useState(task?.priority ?? 3);
  const [dueDate, setDueDate] = useState(
    task ? localDateTimeISO(new Date(task.due_date)) : localDateTimeISO(new Date(Date.now() + 7 * 86400000)),
  );
  const [estimatedHours, setEstimatedHours] = useState(task?.estimated_hours ?? 2);
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const profileClasses = useMemo(() => profile?.classes ?? [], [profile]);

  const subjectSuggestions = useMemo(() => {
    const all = new Set<string>(profileClasses);
    const lower = subject.trim().toLowerCase();
    if (!lower) return [...all].sort();
    return [...all].filter((c) => c.toLowerCase().includes(lower) && c.toLowerCase() !== lower).sort();
  }, [profileClasses, subject]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();

    if (!cleanTitle) e.title = 'Title is required';
    else if (cleanTitle.length > 200) e.title = 'Title cannot exceed 200 characters';

    if (!cleanSubject) e.subject = 'Subject is required';
    else if (cleanSubject.length > 100) e.subject = 'Subject cannot exceed 100 characters';

    if (!dueDate) e.dueDate = 'Due date is required';
    if (isNaN(new Date(dueDate).getTime())) e.dueDate = 'Invalid date selected';

    if (estimatedHours < 0.5) e.estimatedHours = 'Must be at least 0.5 hours';
    if (estimatedHours > 50) e.estimatedHours = 'Cannot exceed 50 hours';

    if (notes && notes.length > 2000) e.notes = 'Notes cannot exceed 2000 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(
      {
        title: title.trim().slice(0, 200),
        type,
        subject: subject.trim().slice(0, 100),
        difficulty: Math.min(5, Math.max(1, difficulty)),
        priority: Math.min(5, Math.max(1, priority)),
        due_date: new Date(dueDate).toISOString(),
        estimated_hours: Math.min(50, Math.max(0.5, estimatedHours)),
        notes: notes.trim().slice(0, 2000) || null,
      },
      task?.id,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-2xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className={`input ${errors.title ? 'border-error-400 focus:ring-error-400' : ''}`}
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus Problem Set 4"
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-error-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value as TaskInput['type'])}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        type === t.value
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <label className="label">Subject</label>
              <input
                className={`input ${errors.subject ? 'border-error-400 focus:ring-error-400' : ''}`}
                value={subject}
                maxLength={100}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setShowSubjectSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 150)}
                placeholder="e.g. Mathematics"
              />
              {errors.subject && (
                <p className="text-xs text-error-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.subject}
                </p>
              )}
              {showSubjectSuggestions && subjectSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 card p-1.5 shadow-lg max-h-40 overflow-y-auto">
                  {subjectSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setSubject(s); setShowSubjectSuggestions(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Due Date</label>
            <input
              type="datetime-local"
              className={`input ${errors.dueDate ? 'border-error-400 focus:ring-error-400' : ''}`}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && (
              <p className="text-xs text-error-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.dueDate}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Difficulty: {difficulty}/5</label>
              <div className="flex gap-1.5 pt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDifficulty(n)}
                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                      n <= difficulty
                        ? 'bg-accent-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Priority: {priority}/5</label>
              <div className="flex gap-1.5 pt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPriority(n)}
                    className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                      n <= priority
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Estimated Study Hours</label>
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              className={`input ${errors.estimatedHours ? 'border-error-400 focus:ring-error-400' : ''}`}
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
            />
            {errors.estimatedHours && (
              <p className="text-xs text-error-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.estimatedHours}
              </p>
            )}
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              maxLength={2000}
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Topics to cover, chapters, etc."
            />
            {errors.notes && (
              <p className="text-xs text-error-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.notes}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}