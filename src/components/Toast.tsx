import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

const ToastContext = createContext<(type: ToastType, message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800',
  error: 'bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800',
  info: 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
};

const ICON_COLORS = {
  success: 'text-success-500',
  error: 'text-error-500',
  info: 'text-primary-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card animate-slide-up pointer-events-auto ${STYLES[toast.type]}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${ICON_COLORS[toast.type]}`} />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
