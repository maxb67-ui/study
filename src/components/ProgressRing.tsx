type Props = {
  progress: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
};

export function ProgressRing({ progress, size = 120, stroke = 10, color, label }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  const ringColor = color ?? '#3380ff';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={ringColor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{Math.round(progress)}%</span>
        {label && <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
