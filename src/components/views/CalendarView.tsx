import { useState, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Sparkles, Clock, BookOpen, FileText, CalendarClock,
  ClipboardList, FlaskConical, FolderKanban, Zap, X, GripVertical, Calendar as CalIcon,
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task, StudyBlock } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { generateSchedule } from '@/lib/scheduler';
import { localDateISO } from '@/lib/dates';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_ICONS: Record<Task['type'], typeof FileText> = {
  homework: ClipboardList,
  assignment: FileText,
  project: FolderKanban,
  quiz: FlaskConical,
  exam: BookOpen,
  deadline: CalendarClock,
};

const TYPE_DOT_COLORS: Record<Task['type'], string> = {
  homework: 'bg-primary-400',
  assignment: 'bg-cyan-400',
  project: 'bg-violet-400',
  quiz: 'bg-success-400',
  exam: 'bg-accent-400',
  deadline: 'bg-error-400',
};

const TYPE_LABELS: Record<Task['type'], string> = {
  homework: 'Homework',
  assignment: 'Assignment',
  project: 'Project',
  quiz: 'Quiz',
  exam: 'Exam',
  deadline: 'Deadline',
};

type ViewMode = 'month' | 'week';

export function CalendarView(props: NavProps) {
  const { tasks, blocks, settings, onBlocksGenerated, startPomodoroForTask, loading } = props;
  const toast = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [draggedBlock, setDraggedBlock] = useState<StudyBlock | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayISO = useMemo(() => localDateISO(new Date()), []);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const tasksByDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      const d = localDateISO(new Date(t.due_date));
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(t);
    }
    return m;
  }, [tasks]);

  const blocksByDate = useMemo(() => {
    const m = new Map<string, StudyBlock[]>();
    for (const b of blocks) {
      if (!m.has(b.scheduled_date)) m.set(b.scheduled_date, []);
      m.get(b.scheduled_date)!.push(b);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return m;
  }, [blocks]);

  const monthCells: (number | null)[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  for (let i = 0; i < startWeekday; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(d);
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  const weekStart = useMemo(() => {
    const d = new Date(cursor);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const days: { date: Date; iso: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push({ date: d, iso: localDateISO(d) });
    }
    return days;
  }, [weekStart]);

  const selectedBlocks = selectedDate ? (blocksByDate.get(selectedDate) ?? []) : [];
  const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) ?? []) : [];

  async function handleGenerate() {
    setGenerating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast('error', 'Authentication required to generate schedule');
      setGenerating(false);
      return;
    }
    const userId = session.user.id;

    const today = new Date();
    const result = generateSchedule(tasks, settings, blocks, props.logs, today);
    if (result.blocks.length === 0) {
      toast('info', 'No active tasks to schedule. Add tasks first.');
      setGenerating(false);
      return;
    }

    // Secure user-scoped deletion
    const { error: delError } = await supabase.from('study_blocks').delete().eq('user_id', userId);
    if (delError) {
      toast('error', 'Failed to clear old schedule');
      setGenerating(false);
      return;
    }

    const { error: insError } = await supabase.from('study_blocks').insert(
      result.blocks.map((b) => ({
        user_id: userId,
        task_id: b.task_id,
        scheduled_date: b.scheduled_date,
        start_time: b.start_time,
        duration_minutes: b.duration_minutes,
        completed: false,
      })),
    );
    if (insError) {
      toast('error', 'Failed to generate schedule');
      setGenerating(false);
      return;
    }
    onBlocksGenerated();
    const parts: string[] = [`${result.totalSessions} sessions planned`];
    if (result.rescheduledCount > 0) parts.push(`${result.rescheduledCount} rescheduled`);
    if (result.unscheduledTasks > 0) parts.push(`${result.unscheduledTasks} couldn't fit`);
    toast('success', `Schedule generated! ${parts.join(' · ')}.`);
    setGenerating(false);
  }

  async function toggleBlock(blockId: string, current: boolean) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from('study_blocks')
      .update({ completed: !current })
      .eq('id', blockId)
      .eq('user_id', userId);

    if (error) {
      toast('error', 'Failed to update session');
      return;
    }
    onBlocksGenerated();
  }

  function onDragStart(e: React.DragEvent, block: StudyBlock) {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', block.id);
  }

  function onDragEnd() {
    setDraggedBlock(null);
    setDragOverDate(null);
  }

  function onDragOver(e: React.DragEvent, dateStr: string) {
    if (!draggedBlock) return;
    if (dateStr === draggedBlock.scheduled_date) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  }

  function onDragLeave(dateStr: string) {
    setDragOverDate((prev) => (prev === dateStr ? null : prev));
  }

  async function onDrop(e: React.DragEvent, newDate: string) {
    e.preventDefault();
    const block = draggedBlock;
    setDraggedBlock(null);
    setDragOverDate(null);
    if (!block || block.scheduled_date === newDate) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    setSavingId(block.id);
    const { error } = await supabase
      .from('study_blocks')
      .update({ scheduled_date: newDate })
      .eq('id', block.id)
      .eq('user_id', userId);

    if (error) {
      toast('error', 'Failed to reschedule session');
      setSavingId(null);
      return;
    }
    onBlocksGenerated();
    setSavingId(null);
    const task = taskMap.get(block.task_id);
    toast('success', `Moved "${task?.title ?? 'session'}" to ${new Date(newDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            <div className="h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Calendar"
        subtitle="Drag study sessions to reschedule"
        action={
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                Week
              </button>
            </div>
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-2 mb-4 text-xs text-neutral-400 dark:text-neutral-500 bg-primary-50/50 dark:bg-primary-950/20 rounded-lg px-3 py-2">
        <GripVertical className="w-3.5 h-3.5 text-primary-400" />
        <span>Drag any study session card to a different day to reschedule it</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 dark:text-white">
              {viewMode === 'month'
                ? `${MONTHS[month]} ${year}`
                : `${weekDays[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  if (viewMode === 'month') setCursor(new Date(year, month - 1, 1));
                  else { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setCursor(d); }
                }}
                className="btn-ghost p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setCursor(new Date()); setSelectedDate(null); }}
                className="btn-ghost px-3 text-xs"
              >
                Today
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'month') setCursor(new Date(year, month + 1, 1));
                  else { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setCursor(d); }
                }}
                className="btn-ghost p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'month' ? (
            <MonthGrid
              cells={monthCells}
              year={year}
              month={month}
              todayISO={todayISO}
              selectedDate={selectedDate}
              tasksByDate={tasksByDate}
              blocksByDate={blocksByDate}
              taskMap={taskMap}
              draggedBlock={draggedBlock}
              dragOverDate={dragOverDate}
              savingId={savingId}
              onSelectDate={setSelectedDate}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ) : (
            <WeekGrid
              weekDays={weekDays}
              todayISO={todayISO}
              selectedDate={selectedDate}
              tasksByDate={tasksByDate}
              blocksByDate={blocksByDate}
              taskMap={taskMap}
              draggedBlock={draggedBlock}
              dragOverDate={dragOverDate}
              savingId={savingId}
              onSelectDate={setSelectedDate}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          )}

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success-400" />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">Study session</span>
            </div>
            {(Object.keys(TYPE_DOT_COLORS) as Task['type'][]).map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${TYPE_DOT_COLORS[t]}`} />
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{TYPE_LABELS[t]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
                {selectedBlocks.length} session{selectedBlocks.length !== 1 ? 's' : ''} · {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
              </p>

              {selectedBlocks.length > 0 && (
                <div className="mb-4">
                  <p className="label">Study Sessions</p>
                  <div className="space-y-2">
                    {selectedBlocks.map((b) => {
                      const task = taskMap.get(b.task_id);
                      const Icon = task ? TYPE_ICONS[task.type] : FileText;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 ${savingId === b.id ? 'animate-pulse' : ''}`}
                        >
                          <button
                            onClick={() => toggleBlock(b.id, b.completed)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              b.completed ? 'bg-success-500 border-success-500' : 'border-neutral-300 dark:border-neutral-600 hover:border-success-400'
                            }`}
                          >
                            {b.completed && <div className="w-2 h-2 rounded-full bg-white" />}
                          </button>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${task ? TYPE_DOT_COLORS[task.type].replace('bg-', 'bg-').replace('-400', '-50') : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                            <Icon className={`w-3.5 h-3.5 ${task ? TYPE_DOT_COLORS[task.type].replace('bg-', 'text-').replace('-400', '-500') : 'text-neutral-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${b.completed ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                              {task?.title ?? 'Unknown task'}
                            </p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {b.start_time.slice(0, 5)} · {b.duration_minutes} min
                            </p>
                          </div>
                          {!b.completed && task && (
                            <button
                              onClick={() => startPomodoroForTask(task.id)}
                              className="btn-ghost p-1.5 text-primary-500"
                              title="Start focus session"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTasks.length > 0 && (
                <div>
                  <p className="label">Due</p>
                  <div className="space-y-2">
                    {selectedTasks.map((t) => {
                      const Icon = TYPE_ICONS[t.type];
                      return (
                        <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                          <Icon className={`w-4 h-4 shrink-0 ${TYPE_DOT_COLORS[t.type].replace('bg-', 'text-').replace('-400', '-500')}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-neutral-900 dark:text-white">{t.title}</p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{t.subject} · {TYPE_LABELS[t.type]}</p>
                          </div>
                          {!t.completed && (
                            <button
                              onClick={() => startPomodoroForTask(t.id)}
                              className="text-xs text-primary-500 font-medium hover:underline shrink-0"
                            >
                              Study
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedBlocks.length === 0 && selectedTasks.length === 0 && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 py-6 text-center">Nothing scheduled this day.</p>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center mb-3">
                <CalIcon className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">Select a date to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type GridProps = {
  todayISO: string;
  selectedDate: string | null;
  tasksByDate: Map<string, Task[]>;
  blocksByDate: Map<string, StudyBlock[]>;
  taskMap: Map<string, Task>;
  draggedBlock: StudyBlock | null;
  dragOverDate: string | null;
  savingId: string | null;
  onSelectDate: (d: string) => void;
  onDragStart: (e: React.DragEvent, b: StudyBlock) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, d: string) => void;
  onDragLeave: (d: string) => void;
  onDrop: (e: React.DragEvent, d: string) => void;
};

function MonthGrid({
  cells, year, month, todayISO, selectedDate,
  tasksByDate, blocksByDate, taskMap,
  draggedBlock, dragOverDate, savingId,
  onSelectDate, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}: GridProps & { cells: (number | null)[]; year: number; month: number }) {
  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square" />;
          const dateStr = localDateISO(new Date(year, month, day));
          const dayTasks = tasksByDate.get(dateStr) ?? [];
          const dayBlocks = blocksByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayISO;
          const isSelected = dateStr === selectedDate;
          const isDragOver = dragOverDate === dateStr;
          const hasItems = dayTasks.length > 0 || dayBlocks.length > 0;

          return (
            <div
              key={i}
              onDragOver={(e) => onDragOver(e, dateStr)}
              onDragLeave={() => onDragLeave(dateStr)}
              onDrop={(e) => onDrop(e, dateStr)}
              className={`aspect-square rounded-lg p-1.5 flex flex-col transition-all relative cursor-pointer ${
                isDragOver ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-950/30 scale-105' : ''
              } ${
                isSelected
                  ? 'bg-primary-500 text-white shadow-soft'
                  : isToday
                  ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                  : hasItems
                  ? 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
              }`}
              onClick={() => onSelectDate(dateStr)}
            >
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : isToday ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                {day}
              </span>
              {hasItems && (
                <div className="flex gap-0.5 mt-auto flex-wrap">
                  {dayBlocks.slice(0, 3).map((b) => {
                    const task = taskMap.get(b.task_id);
                    return (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, b)}
                        onDragEnd={onDragEnd}
                        className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : TYPE_DOT_COLORS[task?.type ?? 'homework']} ${
                          draggedBlock?.id === b.id ? 'opacity-30' : ''
                        } ${savingId === b.id ? 'animate-pulse' : ''} cursor-grab active:cursor-grabbing`}
                        title={`${task?.title ?? 'Session'} · ${b.start_time.slice(0, 5)}`}
                      />
                    );
                  })}
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/70' : TYPE_DOT_COLORS[t.type]}`}
                    />
                  ))}
                  {dayBlocks.length + dayTasks.length > 6 && (
                    <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                      +{dayBlocks.length + dayTasks.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekGrid({
  weekDays, todayISO, selectedDate,
  tasksByDate, blocksByDate, taskMap,
  draggedBlock, dragOverDate, savingId,
  onSelectDate, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}: GridProps & { weekDays: { date: Date; iso: string }[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDays.map(({ date, iso }) => {
        const dayTasks = tasksByDate.get(iso) ?? [];
        const dayBlocks = blocksByDate.get(iso) ?? [];
        const isToday = iso === todayISO;
        const isSelected = iso === selectedDate;
        const isDragOver = dragOverDate === iso;

        return (
          <div
            key={iso}
            onDragOver={(e) => onDragOver(e, iso)}
            onDragLeave={() => onDragLeave(iso)}
            onDrop={(e) => onDrop(e, iso)}
            onClick={() => onSelectDate(iso)}
            className={`min-h-[120px] rounded-lg p-2 flex flex-col gap-1 cursor-pointer transition-all ${
              isDragOver ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-950/30' : ''
            } ${
              isSelected
                ? 'bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-300 dark:ring-primary-700'
                : isToday
                ? 'bg-primary-50/50 dark:bg-primary-950/20'
                : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-xs font-semibold ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {date.getDate()}
              </span>
              {isToday && <span className="text-[9px] font-medium text-primary-500 uppercase">Today</span>}
            </div>

            {dayBlocks.map((b) => {
              const task = taskMap.get(b.task_id);
              const Icon = task ? TYPE_ICONS[task.type] : FileText;
              return (
                <div
                  key={b.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, b)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-1 p-1.5 rounded-md text-[10px] cursor-grab active:cursor-grabbing transition-all ${
                    b.completed
                      ? 'bg-success-100 dark:bg-success-950/30 opacity-60'
                      : 'bg-white dark:bg-neutral-700 shadow-sm'
                  } ${draggedBlock?.id === b.id ? 'opacity-30' : ''} ${savingId === b.id ? 'animate-pulse' : ''} ${
                    isDragOver && draggedBlock?.id !== b.id ? 'ring-1 ring-primary-300' : ''
                  } hover:shadow-md`}
                  title={`${task?.title ?? 'Session'} · ${b.start_time.slice(0, 5)} · ${b.duration_minutes}min`}
                >
                  <Icon className={`w-3 h-3 shrink-0 ${task ? TYPE_DOT_COLORS[task.type].replace('bg-', 'text-').replace('-400', '-500') : 'text-neutral-400'}`} />
                  <span className="font-mono text-neutral-400 dark:text-neutral-500 shrink-0">{b.start_time.slice(0, 5)}</span>
                  <span className="truncate text-neutral-700 dark:text-neutral-200 font-medium">{task?.title ?? 'Session'}</span>
                </div>
              );
            })}

            {dayTasks.map((t) => {
              const Icon = TYPE_ICONS[t.type];
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-1 p-1.5 rounded-md text-[10px] ${
                    t.completed ? 'opacity-50' : ''
                  } ${TYPE_DOT_COLORS[t.type].replace('bg-', 'bg-').replace('-400', '-50 dark:bg-').replace('-50', '-950/20')}`}
                >
                  <Icon className={`w-3 h-3 shrink-0 ${TYPE_DOT_COLORS[t.type].replace('bg-', 'text-').replace('-400', '-500')}`} />
                  <span className={`truncate ${t.completed ? 'line-through text-neutral-400' : 'text-neutral-700 dark:text-neutral-200 font-medium'}`}>
                    {t.title}
                  </span>
                </div>
              );
            })}

            {dayBlocks.length === 0 && dayTasks.length === 0 && (
              <div className="flex-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}