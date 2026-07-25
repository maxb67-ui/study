import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Bug, RefreshCw } from 'lucide-react';
import { logError, getErrorLogs, clearErrorLogs } from '@/lib/errorHandler';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
  showLogs: boolean;
};

// Strict check for production
const IS_PROD = import.meta.env.PROD;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showLogs: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sanitize stack trace before logging
    const trace = errorInfo.componentStack?.slice(0, 150) || 'Unknown Location';
    logError(error, `Component Crash: ${trace}`);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showLogs: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const logs = getErrorLogs();

      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-5 text-neutral-900 dark:text-neutral-100">
          <div className="card max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl border-error-200 dark:border-error-900/40 animate-scale-in">
            <div className="w-16 h-16 rounded-3xl bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 text-error-500 flex items-center justify-center mx-auto shadow-glow-error">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Something Went Wrong</h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                Lumora encountered an unexpected issue. Your academic data and study progress are securely saved in the cloud.
              </p>
            </div>

            {/* Technical details only visible in development */}
            {!IS_PROD && this.state.error && (
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-left text-xs font-mono text-neutral-600 dark:text-neutral-300 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={this.handleReset} className="btn-primary w-full sm:w-auto text-xs py-2.5">
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button onClick={this.handleReload} className="btn-secondary w-full sm:w-auto text-xs py-2.5">
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
            </div>

            {/* Diagnostic panel strictly hidden in production */}
            {!IS_PROD && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => this.setState((s) => ({ showLogs: !s.showLogs }))}
                  className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-medium flex items-center gap-1 mx-auto"
                >
                  <Bug className="w-3.5 h-3.5" />
                  {this.state.showLogs ? 'Hide Diagnostics' : 'View Diagnostics (Dev Only)'}
                </button>

                {this.state.showLogs && (
                  <div className="mt-3 p-3 rounded-xl bg-neutral-900 text-neutral-200 text-left text-[10px] font-mono space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                      <span className="font-bold text-amber-400">Sanitized Error History ({logs.length})</span>
                      <button onClick={() => { clearErrorLogs(); this.forceUpdate(); }} className="text-neutral-400 hover:text-white underline text-[9px]">Clear</button>
                    </div>
                    {logs.length === 0 && <p className="text-neutral-500 italic">No logs in current session.</p>}
                    {logs.map((log) => (
                      <div key={log.id} className="space-y-0.5 border-b border-neutral-800/50 pb-1">
                        <p className="text-neutral-400">[{new Date(log.timestamp).toLocaleTimeString()}] {log.context}</p>
                        <p className="text-error-400">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}