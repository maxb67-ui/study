import type { View } from '@/App';
import type { Task, StudyBlock, StudyLog, Settings, Note, NoteInput } from '@/lib/supabase';

export type NavProps = {
  view: View;
  setView: (v: View) => void;
  tasks: Task[];
  blocks: StudyBlock[];
  logs: StudyLog[];
  notes: Note[];
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  pomodoroTaskId: string | null;
  setPomodoroTaskId: (id: string | null) => void;
  startPomodoroForTask: (taskId: string) => void;
  onAddTask: () => void;
  onQuickFocus: () => void;
  onBlocksGenerated: () => void;
  onLogAdded: () => void;
  reloadTasks: () => void;
  reloadBlocks: () => void;
  reloadNotes: () => void;
  onSaveNote: (n: NoteInput, id?: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  loading: boolean;
};