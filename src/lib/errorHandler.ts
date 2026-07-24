export type ErrorLogEntry = {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  context?: string;
};

const ERROR_LOG_KEY = 'lumora_error_logs_v1';

/**
 * Logs errors locally to localStorage for diagnostic review.
 */
export function logError(error: unknown, context?: string): ErrorLogEntry {
  const errObj = error instanceof Error ? error : new Error(String(error));
  const entry: ErrorLogEntry = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message: errObj.message,
    stack: errObj.stack,
    context,
  };

  console.error(`[Lumora Error]${context ? ` [${context}]` : ''}:`, errObj);

  try {
    const existing: ErrorLogEntry[] = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    const updated = [entry, ...existing].slice(0, 30); // Store up to 30 entries
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updated));
  } catch {}

  return entry;
}

export function getErrorLogs(): ErrorLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearErrorLogs(): void {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
  } catch {}
}

/**
 * Translates raw tech/API error messages into clear, human-friendly guidance.
 */
export function parseUserFriendlyError(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallbackMessage;
  const msg = typeof error === 'string' ? error : (error as any)?.message || String(error);

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network request failed')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please check your credentials.';
  }
  if (msg.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('JWT expired') || msg.includes('session_expired')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  return msg || fallbackMessage;
}

/**
 * Executes an async operation with automatic retry logic and exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; backoff?: number; context?: string } = {},
): Promise<T> {
  const { retries = 2, delayMs = 500, backoff = 2, context = 'Async Operation' } = options;
  let attempt = 0;
  let currentDelay = delayMs;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) {
        logError(err, `${context} (failed after ${retries + 1} attempts)`);
        throw err;
      }
      await new Promise((res) => setTimeout(res, currentDelay));
      currentDelay *= backoff;
    }
  }
}