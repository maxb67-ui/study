import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, BookOpen, FileText, CalendarClock, ClipboardList, FlaskConical, FolderKanban, GraduationCap } from 'lucide-react';
import type { Task, TaskInput, Course } from '@/lib/supabase';
import { localDateTimeISO } from '@/lib/dates';
import { useAuth } from '@/lib/auth';

type Props = {
  task: Task | null;
  courses?: Course[];
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

export function TaskModal({ task, courses = [], onSave, onClose, saving }: Props) {
  const { profile } = useAuth();
  const [title, setTitle] = useState(task?.title ?? '');
  const [type, setType] = useState<TaskInput['type']>(task?.type ?? 'assignment');
  const [subject, setSubject] = useState(task?.subject ?? '');
  const [courseId, setCourseId] = useState(task?.course_id ?? '');
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [difficulty, setDifficulty] = useState(task?.difficulty ?? 3);
  const [priority, setPriority] = useState(task?.priority ?? 3);
  const [dueDate, setDueDate] = useState(
    task ? localDateTimeISO(new Date(task.due_date)) : localDateTimeISO(new Date(Date.now() + 7 * 86400000)),
  );
  const [estimatedHours, setEstimatedHours] = useState(task?.estimated_hours ?? 2);
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const profileClasses = useMemo(() => {
    const fromProfile = profile?.classes ?? [];
    const fromCourses = courses.map(c => c.name);
    return Array.from(new Set([...fromProfile, ...fromCourses]));
  }, [profile, courses]);

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

  function handleCourseChange(id: string) {
    setCourseId(id);
    const course = courses.find(c => c.id === id);
    if (course) setSubject(course.name);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();

    if (!cleanTitle) e.title = 'Title is required';
    if (!cleanSubject) e.subject = 'Subject is required';
    if (!dueDate) e.dueDate = 'Due date is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave(
      {
        title: title.trim(),
        type,
        subject: subject.trim(),
        course_id: courseId || null,
        difficulty: Math.min(5, Math.max(1, difficulty)),
        priority: Math.min(5, Math.max(1, priority)),
        due_date: new Date(dueDate).toISOString(),
        estimated_hours: Math.min(50, Math.max(0.5, estimatedHours)),
        notes: notes.trim() || null,
      },
      task?.id,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-2xl p-6 animate-scale-in"
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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus Problem Set 4"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Linked Course</label>
              <select 
                value={courseId} 
                onChange={e => handleCourseChange(e.target.value)} 
                className="input text-xs"
              >
                <option value="">Unlinked</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="label">Subject</label>
              <input
                className={`input ${errors.subject ? 'border-error-400 focus:ring-error-400' : ''}`}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setShowSubjectSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 150)}
                placeholder="e.g. Mathematics"
              />
              {showSubjectSuggestions && subjectSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 card p-1.5 shadow-lg max-h-40 overflow-y-auto">
                  {subjectSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setSubject(s); setShowSubjectSuggestions(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-[10px] font-medium transition-all ${
                        type === t.value
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="datetime-local"
                className="input text-xs"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Difficulty: {difficulty}/5</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDifficulty(n)}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${
                      n <= difficulty ? 'bg-accent-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Priority: {priority}/5</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPriority(n)}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${
                      n <= priority ? 'bg-primary-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Est. Hours</label>
            <input type="number" step="0.5" className="input" value={estimatedHours} onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px] resize-none" value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} />
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