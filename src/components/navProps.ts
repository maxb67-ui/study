import type { View } from '@/App';
import type { Task, StudyBlock, StudyLog, Settings } from '@/lib/supabase';

export type NavProps = {
  view: View;
  setView: (v: View) => void;
  tasks: Task[];
  blocks: StudyBlock[];
  logs: StudyLog[];
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
  loading: boolean;
};
