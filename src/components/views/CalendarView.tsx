import { useState, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Sparkles, Clock, BookOpen, FileText, CalendarClock,
  ClipboardList, FlaskConical, FolderKanban, Zap, X, GripVertical, Calendar as CalIcon,
  LayoutGrid, List, Maximize2
} from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Task, StudyBlock, Course } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { generateSchedule } from '@/lib/scheduler';
import { localDateISO, addDays } from '@/lib/dates';
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

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView(props: NavProps) {
  const { tasks, blocks, courses, settings, onBlocksGenerated, startPomodoroForTask, loading } = props;
  const toast = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(localDateISO(new Date()));
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [draggedBlock, setDraggedBlock] = useState<StudyBlock | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayISO = useMemo(() => localDateISO(new Date()), []);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

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

  // Generate monthly grid
  const monthCells: (number | null)[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  for (let i = 0; i < startWeekday; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(d);
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  // Generate weekly grid
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
  
  // Courses that meet on selected day (Simplified logic for recurring schedules)
  const selectedCourses = useMemo(() => {
    if (!selectedDate) return [];
    const dayName = new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short' });
    return courses.filter(c => c.schedule?.includes(dayName));
  }, [courses, selectedDate]);

  async function handleGenerate() {
    setGenerating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast('error', 'Authentication required');
      setGenerating(false);
      return;
    }
    
    const result = generateSchedule(tasks, settings, blocks, props.logs, new Date());
    if (result.blocks.length === 0) {
      toast('info', 'No active tasks to schedule');
      setGenerating(false);
      return;
    }

    const { error: delError } = await supabase.from('study_blocks').delete().eq('user_id', session.user.id);
    if (delError) {
      toast('error', 'Failed to clear old schedule');
      setGenerating(false);
      return;
    }

    const { error: insError } = await supabase.from('study_blocks').insert(
      result.blocks.map((b) => ({
        user_id: session.user.id,
        task_id: b.task_id,
        scheduled_date: b.scheduled_date,
        start_time: b.start_time,
        duration_minutes: b.duration_minutes,
        completed: false,
      })),
    );
    
    if (insError) toast('error', 'Failed to generate schedule');
    else {
      onBlocksGenerated();
      toast('success', 'AI Schedule updated with fresh logic');
    }
    setGenerating(false);
  }

  async function toggleBlock(blockId: string, current: boolean) {
    const { error } = await supabase.from('study_blocks').update({ completed: !current }).eq('id', blockId);
    if (error) toast('error', 'Update failed');
    else onBlocksGenerated();
  }

  const handleDragStart = (e: React.DragEvent, block: StudyBlock) => {
    setDraggedBlock(block);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newDate: string) => {
    e.preventDefault();
    const block = draggedBlock;
    setDraggedBlock(null);
    setDragOverDate(null);
    if (!block || block.scheduled_date === newDate) return;

    setSavingId(block.id);
    const { error } = await supabase.from('study_blocks').update({ scheduled_date: newDate }).eq('id', block.id);

    if (error) {
      toast('error', 'Reschedule failed');
    } else {
      onBlocksGenerated();
      const task = taskMap.get(block.task_id);
      toast('success', `Moved "${task?.title}" to ${new Date(newDate + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`);
    }
    setSavingId(null);
  };

  if (loading) return <div className="p-8"><div className="h-20 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-2xl" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader
        title="Study Calendar"
        subtitle="Manage your classes, deadlines, and AI focus blocks"
        action={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 gap-1">
              {(['month', 'week', 'day'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === m ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Updating...' : 'Regenerate'}
            </button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-lg text-neutral-900 dark:text-white">
                {viewMode === 'month' ? `${MONTHS[month]} ${year}` : viewMode === 'week' ? 'Weekly Overview' : 'Daily Schedule'}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  const d = new Date(cursor);
                  if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
                  else if (viewMode === 'week') d.setDate(d.getDate() - 7);
                  else d.setDate(d.getDate() - 1);
                  setCursor(d);
                }} className="btn-secondary p-2"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setCursor(new Date())} className="btn-secondary text-xs font-bold px-3">Today</button>
                <button onClick={() => {
                  const d = new Date(cursor);
                  if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
                  else if (viewMode === 'week') d.setDate(d.getDate() + 7);
                  else d.setDate(d.getDate() + 1);
                  setCursor(d);
                }} className="btn-secondary p-2"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            {viewMode === 'month' && (
              <MonthGrid 
                cells={monthCells} year={year} month={month} todayISO={todayISO} selectedDate={selectedDate}
                blocksByDate={blocksByDate} tasksByDate={tasksByDate} taskMap={taskMap} courseMap={courseMap}
                draggedBlock={draggedBlock} dragOverDate={dragOverDate} savingId={savingId}
                onSelectDate={setSelectedDate} onDragStart={handleDragStart} onDragOver={setDragOverDate} onDrop={handleDrop}
              />
            )}

            {viewMode === 'week' && (
              <WeekGrid 
                days={weekDays} todayISO={todayISO} selectedDate={selectedDate}
                blocksByDate={blocksByDate} tasksByDate={tasksByDate} taskMap={taskMap} courseMap={courseMap}
                onSelectDate={setSelectedDate} onDragStart={handleDragStart} onDragOver={setDragOverDate} onDrop={handleDrop}
              />
            )}

            {viewMode === 'day' && (
              <DayGrid 
                date={selectedDate || todayISO} todayISO={todayISO}
                blocks={selectedBlocks} tasks={selectedTasks} courses={selectedCourses} taskMap={taskMap}
                onToggleBlock={toggleBlock} onStartPomodoro={startPomodoroForTask}
              />
            )}
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-4">
              <List className="w-4 h-4 text-primary-500" />
              Day Details
            </h3>
            
            <div className="space-y-5">
              {selectedCourses.length > 0 && (
                <div>
                  <p className="label text-[10px]">Classes</p>
                  <div className="space-y-2">
                    {selectedCourses.map(c => (
                      <div key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: c.color }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{c.name}</p>
                          <p className="text-[10px] text-neutral-400 font-medium">{c.schedule}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBlocks.length > 0 && (
                <div>
                  <p className="label text-[10px]">Study Sessions</p>
                  <div className="space-y-2">
                    {selectedBlocks.map(b => {
                      const task = taskMap.get(b.task_id);
                      return (
                        <div key={b.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 ${savingId === b.id ? 'animate-pulse' : ''}`}>
                          <button onClick={() => toggleBlock(b.id, b.completed)} className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${b.completed ? 'bg-success-500 border-success-500' : 'border-neutral-300'}`}>
                            {b.completed && <div className="w-2 h-2 rounded-full bg-white" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${b.completed ? 'text-neutral-400 line-through' : 'text-neutral-800 dark:text-neutral-200'}`}>{task?.title}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">{b.start_time.slice(0,5)} · {b.duration_minutes}m</p>
                          </div>
                          {!b.completed && (
                            <button onClick={() => startPomodoroForTask(b.task_id)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950"><Zap className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedBlocks.length === 0 && selectedTasks.length === 0 && selectedCourses.length === 0 && (
                <div className="text-center py-8">
                  <CalIcon className="w-8 h-8 text-neutral-200 dark:text-neutral-700 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">Nothing planned for this day</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({ cells, year, month, todayISO, selectedDate, blocksByDate, tasksByDate, taskMap, courseMap, dragOverDate, onSelectDate, onDragStart, onDragOver, onDrop }: any) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map(d => <div key={d} className="text-center text-[10px] font-black uppercase text-neutral-400 pb-2">{d}</div>)}
      {cells.map((day: any, i: number) => {
        if (day === null) return <div key={i} />;
        const iso = localDateISO(new Date(year, month, day));
        const active = selectedDate === iso;
        const isToday = todayISO === iso;
        const blocks = blocksByDate.get(iso) ?? [];
        const isDragOver = dragOverDate === iso;

        return (
          <div
            key={i}
            onDragOver={e => { e.preventDefault(); onDragOver(iso); }}
            onDrop={e => onDrop(e, iso)}
            onClick={() => onSelectDate(iso)}
            className={`aspect-square rounded-2xl p-2 cursor-pointer transition-all border-2 relative flex flex-col ${
              isDragOver ? 'border-primary-500 bg-primary-50 scale-105 z-10' :
              active ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 
              isToday ? 'border-primary-200 dark:border-primary-800 bg-white dark:bg-neutral-900' :
              'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <span className={`text-xs font-bold ${isToday ? 'text-primary-600' : 'text-neutral-500'}`}>{day}</span>
            <div className="flex flex-wrap gap-1 mt-auto">
              {blocks.slice(0, 3).map((b: any) => (
                <div 
                  key={b.id} 
                  draggable 
                  onDragStart={e => onDragStart(e, b)}
                  className="w-1.5 h-1.5 rounded-full bg-primary-400 cursor-grab active:cursor-grabbing" 
                />
              ))}
              {(tasksByDate.get(iso) ?? []).slice(0, 2).map((t: any) => (
                <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT_COLORS[t.type as Task['type']]}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekGrid({ days, todayISO, selectedDate, blocksByDate, tasksByDate, taskMap, onSelectDate, onDragStart, onDragOver, onDrop }: any) {
  return (
    <div className="grid grid-cols-7 gap-3 h-[400px]">
      {days.map((d: any) => {
        const iso = d.iso;
        const isToday = todayISO === iso;
        const active = selectedDate === iso;
        const dayBlocks = blocksByDate.get(iso) ?? [];
        const dayTasks = tasksByDate.get(iso) ?? [];

        return (
          <div 
            key={iso}
            onClick={() => onSelectDate(iso)}
            onDragOver={e => { e.preventDefault(); onDragOver(iso); }}
            onDrop={e => onDrop(e, iso)}
            className={`flex flex-col rounded-2xl border-2 transition-all p-2.5 overflow-hidden ${
              active ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 
              isToday ? 'border-primary-100 dark:border-primary-900 bg-primary-50/20' : 
              'border-neutral-100 dark:border-neutral-800'
            }`}
          >
            <div className="text-center mb-3">
              <p className="text-[10px] font-black uppercase text-neutral-400">{d.date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className={`text-sm font-bold ${isToday ? 'text-primary-600' : 'text-neutral-800 dark:text-neutral-200'}`}>{d.date.getDate()}</p>
            </div>
            
            <div className="space-y-1.5 overflow-y-auto no-scrollbar">
              {dayBlocks.map((b: any) => (
                <div 
                  key={b.id} 
                  draggable 
                  onDragStart={e => onDragStart(e, b)}
                  className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-neutral-700 text-[9px] font-bold cursor-grab active:cursor-grabbing truncate"
                >
                  {b.start_time.slice(0,5)} {taskMap.get(b.task_id)?.title}
                </div>
              ))}
              {dayTasks.map((t: any) => (
                <div key={t.id} className={`p-1.5 rounded-lg ${TYPE_DOT_COLORS[t.type as Task['type']]} text-white text-[9px] font-black truncate`}>
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayGrid({ date, todayISO, blocks, tasks, courses, taskMap, onToggleBlock, onStartPomodoro }: any) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM
  
  return (
    <div className="relative h-[600px] overflow-y-auto pr-2">
      <div className="space-y-0.5">
        {hours.map(hour => (
          <div key={hour} className="flex group min-h-[60px] border-b border-neutral-100 dark:border-neutral-800/50">
            <div className="w-16 pt-2 pr-4 text-right">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
            <div className="flex-1 relative bg-neutral-50/30 dark:bg-neutral-900/10 group-hover:bg-neutral-100/50 transition-colors">
              {/* Render study blocks in correct hour slots */}
              {blocks.filter((b: any) => parseInt(b.start_time.split(':')[0]) === hour).map((b: any) => (
                <div key={b.id} className="absolute inset-x-2 top-1 bottom-1 p-2 rounded-xl bg-primary-500 text-white shadow-lg border border-primary-400 z-10 animate-scale-in">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black truncate">{taskMap.get(b.task_id)?.title}</p>
                    <button onClick={() => onStartPomodoro(b.task_id)} className="shrink-0 p-1 rounded-lg bg-white/20 hover:bg-white/40"><Zap className="w-3 h-3" /></button>
                  </div>
                  <p className="text-[9px] font-bold opacity-80">{b.duration_minutes}m Session</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}