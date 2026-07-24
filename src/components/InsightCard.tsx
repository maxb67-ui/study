import { CheckCircle2, AlertCircle, Lightbulb, Zap } from 'lucide-react';
import type { Insight } from '@/lib/scheduler';

const TONE_CONFIG = {
  positive: { icon: CheckCircle2, bg: 'bg-success-50 dark:bg-success-950/20', text: 'text-success-700 dark:text-success-400', iconColor: 'text-success-500' },
  warning: { icon: AlertCircle, bg: 'bg-warning-50 dark:bg-warning-950/20', text: 'text-warning-700 dark:text-warning-400', iconColor: 'text-warning-500' },
  neutral: { icon: Lightbulb, bg: 'bg-neutral-50 dark:bg-neutral-800/50', text: 'text-neutral-600 dark:text-neutral-300', iconColor: 'text-neutral-400' },
  action: { icon: Zap, bg: 'bg-primary-50 dark:bg-primary-950/20', text: 'text-primary-700 dark:text-primary-400', iconColor: 'text-primary-500' },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const config = TONE_CONFIG[insight.tone];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${config.bg} animate-scale-in`}>
      <Icon className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />
      <p className={`text-sm ${config.text} leading-relaxed`}>{insight.message}</p>
    </div>
  );
}
