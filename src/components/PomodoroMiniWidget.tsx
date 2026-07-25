import { Play, Pause, Maximize2, RotateCcw } from 'lucide-react';
import { usePomodoro } from '@/lib/usePomodoroContext';
import type { View } from '@/App';

export function PomodoroMiniWidget({ view, setView }: { view: View; setView: (v: View) => void }) {
  const { running, secondsLeft, mode, selectedTask, toggleRunning, reset } = usePomodoro();

  if (view === 'pomodoro' || (!running && secondsLeft === 0)) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-3 bg-neutral-900/90 dark:bg-neutral-800/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-card border border-neutral-700 animate-slide-up">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${running ? 'bg-success-400 animate-pulse' : 'bg-warning-400'}`} />
        <span className="font-mono font-bold text-sm">{timeStr}</span>
        <span className="text-xs text-neutral-400 capitalize hidden sm:inline">({mode})</span>
      </div>

      {selectedTask && (
        <span className="text-xs text-neutral-300 max-w-[120px] truncate hidden md:inline border-l border-neutral-700 pl-2">
          {selectedTask.title}
        </span>
      )}

      <div className="flex items-center gap-1 border-l border-neutral-700 pl-2">
        <button
          onClick={toggleRunning}
          className="p-1.5 rounded-lg hover:bg-neutral-700/60 transition-colors text-white"
          title={running ? 'Pause Timer' : 'Resume Timer'}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={reset}
          className="p-1.5 rounded-lg hover:bg-neutral-700/60 transition-colors text-neutral-400 hover:text-white"
          title="Restart Session"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setView('pomodoro')}
          className="p-1.5 rounded-lg hover:bg-neutral-700/60 transition-colors text-primary-400"
          title="Open Focus Timer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}