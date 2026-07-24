import { Loader2 } from 'lucide-react';

export function ViewSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-4 w-72 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="h-14 w-full bg-neutral-200/80 dark:bg-neutral-800/80 rounded-2xl" />

      {/* Grid Content Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl p-5 space-y-3">
            <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-700 rounded-md" />
            <div className="h-6 w-3/4 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
            <div className="h-12 w-full bg-neutral-300/50 dark:bg-neutral-700/50 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 bg-neutral-200/70 dark:bg-neutral-800/70 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-neutral-300 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-56 bg-neutral-300/60 dark:bg-neutral-700/60 rounded" />
          </div>
          <div className="h-8 w-20 bg-neutral-300 dark:bg-neutral-700 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SpinnerFallback({ message = 'Loading view...' }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  );
}