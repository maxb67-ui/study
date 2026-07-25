"use client";

import { useState, useMemo } from 'react';
import { Plus, Trash2, BookOpen, FileText, ClipboardList, FlaskConical, FolderKanban, CalendarClock, ListTodo, CheckCircle2, AlertTriangle, Clock, Filter, ArrowDownUp, Zap, Pencil, Check, X } from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task, TaskInput } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { localDateISO, daysBetween } from '@/lib/dates';
import { PageHeader } from '@/components/PageHeader';
import { TaskModal } from '@/components/TaskModal';
import { useToast } from '@/components/Toast';

export function TasksView(props: NavProps) {
  const { tasks, reloadTasks, startPomodoroForTask, loading } = props;
  const { user, profile } = useAuth();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortKey, setSortKey] = useState('dueDate');
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  async function toggleComplete(task: Task) {
    if (!user) {
      toast('error', 'Authentication required');
      return;
    }
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .eq('user_id', user.id); // IDOR prevention: strict ownership filter

    if (error) toast('error', 'Update failed');
    else {
      reloadTasks();
      toast('success', task.completed ? 'Reopened task' : 'Task completed!');
    }
  }

  async function deleteTask(id: string) {
    if (!user) {
      toast('error', 'Authentication required');
      return;
    }
    // Sequential user-owned deletions
    await supabase.from('study_blocks').delete().eq('task_id', id).eq('user_id', user.id);
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);

    if (error) toast('error', 'Delete failed');
    else {
      reloadTasks();
      setDeleteConfirm(null);
      toast('success', 'Task removed');
    }
  }

  async function saveTask(data: TaskInput, id?: string) {
    if (!user) {
      toast('error', 'Authentication required');
      return;
    }
    setSaving(true);
    if (id) {
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id); // IDOR prevention: strict ownership filter
      if (error) toast('error', 'Update failed');
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert({ ...data, user_id: user.id, completed: false });
      if (error) toast('error', 'Add failed');
    }
    reloadTasks();
    setModalOpen(false);
    setSaving(false);
  }

  if (loading) return <div className="p-8 animate-pulse bg-neutral-100 rounded-3xl" />;

  return (
    <div className="max-w-4xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader 
        title="Tasks" 
        subtitle="Manage your academic workload" 
        action={<button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Task</button>} 
      />

      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="card p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleComplete(task)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-success-500 border-success-500' : 'border-neutral-300'}`}>
                {task.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <div>
                <p className={`text-sm font-bold ${task.completed ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>{task.title}</p>
                <p className="text-[10px] text-neutral-400 font-medium">{task.subject} · {task.type}</p>
              </div>
            </div>
            <button onClick={() => setDeleteConfirm(task)} className="p-2 text-neutral-300 hover:text-error-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {modalOpen && <TaskModal task={editing} onSave={saveTask} onClose={() => setModalOpen(false)} saving={saving} />}
      
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card p-6 max-w-sm w-full text-center">
            <AlertTriangle className="w-10 h-10 text-error-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Delete Task?</h3>
            <p className="text-sm text-neutral-500 mb-6">Are you sure you want to remove "{deleteConfirm.title}"?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteTask(deleteConfirm.id)} className="btn bg-error-500 text-white flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}