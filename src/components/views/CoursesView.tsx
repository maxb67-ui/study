import { useState, useMemo } from 'react';
import { 
  Plus, GraduationCap, User, Calendar, BookOpen, ExternalLink, 
  Trash2, Edit3, ChevronRight, Clock, CheckCircle2, AlertCircle, Sparkles 
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Course, CourseInput, Task } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

const PALETTE = [
  '#3380ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function CoursesView(props: NavProps) {
  const { courses, tasks, reloadCourses, setView, loading } = props;
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [schedule, setSchedule] = useState('');
  const [syllabusUrl, setSyllabusUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditing(null);
    setName('');
    setTeacher('');
    setSchedule('');
    setSyllabusUrl('');
    setSelectedColor(PALETTE[0]);
    setModalOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setName(course.name);
    setTeacher(course.teacher || '');
    setSchedule(course.schedule || '');
    setSyllabusUrl(course.syllabus_url || '');
    setSelectedColor(course.color);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return toast('error', 'Course name is required');
    setSaving(true);

    const input: CourseInput = {
      name: name.trim(),
      teacher: teacher.trim() || null,
      schedule: schedule.trim() || null,
      syllabus_url: syllabusUrl.trim() || null,
      color: selectedColor,
      grading_weights: editing?.grading_weights || null,
    };

    const { error } = editing 
      ? await supabase.from('courses').update(input).eq('id', editing.id)
      : await supabase.from('courses').insert({ ...input, user_id: (await supabase.auth.getUser()).data.user?.id });

    if (error) {
      toast('error', 'Failed to save course');
    } else {
      toast('success', editing ? 'Course updated' : 'Course added');
      reloadCourses();
      setModalOpen(false);
    }
    setSaving(false);
  }

  async function deleteCourse(id: string) {
    if (!confirm('Are you sure? This will not delete your tasks, but they will be unlinked.')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast('error', 'Failed to delete course');
    else {
      toast('success', 'Course deleted');
      reloadCourses();
    }
  }

  if (loading) return <div className="p-8 animate-pulse space-y-4"><div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader 
        title="Class Management" 
        subtitle="Organize your courses, teachers, and syllabus materials" 
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        }
      />

      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">No courses added yet</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 mb-6">Add your semester classes to start organizing your workload</p>
          <button onClick={openAdd} className="btn-primary mx-auto">Create Your First Course</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course} 
              tasks={tasks.filter(t => t.course_id === course.id || t.subject === course.name)} 
              onEdit={() => openEdit(course)}
              onDelete={() => deleteCourse(course.id)}
              onViewTasks={() => setView('tasks')}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="card w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-5">{editing ? 'Edit Course' : 'Add New Course'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Course Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. Intro to Psychology" />
              </div>
              <div>
                <label className="label">Instructor / Teacher</label>
                <input value={teacher} onChange={e => setTeacher(e.target.value)} className="input" placeholder="Dr. Jane Smith" />
              </div>
              <div>
                <label className="label">Meeting Schedule</label>
                <input value={schedule} onChange={e => setSchedule(e.target.value)} className="input" placeholder="Mon, Wed @ 10:00 AM" />
              </div>
              <div>
                <label className="label">Course Color</label>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, tasks, onEdit, onDelete, onViewTasks }: { course: Course; tasks: Task[]; onEdit: () => void; onDelete: () => void; onViewTasks: () => void }) {
  const upcoming = tasks.filter(t => !t.completed).sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).slice(0, 3);
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="card overflow-hidden group">
      <div className="h-2 w-full" style={{ backgroundColor: course.color }} />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-primary-500 transition-colors">{course.name}</h3>
            {course.teacher && <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5"><User className="w-3 h-3" /> {course.teacher}</p>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><Edit3 className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-error-50 dark:hover:bg-error-950 text-error-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Tasks</span>
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{tasks.length} Total</span>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Progress</span>
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{progress}%</span>
          </div>
        </div>

        {course.schedule && (
          <div className="flex items-center gap-2 text-xs text-neutral-500 bg-primary-50/30 dark:bg-primary-950/20 p-2 rounded-lg border border-primary-100/50 dark:border-primary-900/30">
            <Calendar className="w-3.5 h-3.5 text-primary-500" />
            <span className="font-medium">{course.schedule}</span>
          </div>
        )}

        <div>
          <p className="label text-[10px] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" /> Upcoming Work
          </p>
          <div className="space-y-1.5">
            {upcoming.length > 0 ? upcoming.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-[11px]">
                <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'exam' ? 'bg-accent-500' : 'bg-primary-500'}`} />
                <span className="flex-1 font-medium truncate dark:text-neutral-300">{t.title}</span>
                <span className="text-neutral-400 shrink-0">{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            )) : (
              <p className="text-[11px] text-neutral-400 italic">No pending assignments</p>
            )}
          </div>
        </div>

        <button onClick={onViewTasks} className="btn-secondary w-full text-xs py-2 group-hover:bg-primary-500 group-hover:text-white transition-all">
          Manage Assignments <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}