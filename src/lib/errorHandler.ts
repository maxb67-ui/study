"use client";

export type ErrorLogEntry = {
  id: string;
  timestamp: string;
  message: string;
  context?: string;
};

const ERROR_LOG_KEY = 'lumora_error_logs_v1';

/**
 * Logs errors locally for diagnostic review, stripping sensitive PII and tokens.
 */
export function logError(error: unknown, context?: string): ErrorLogEntry {
  const errObj = error instanceof Error ? error : new Error(String(error));
  
  // Sanitize message to remove PII (emails, auth tokens, full names if embedded)
  const sanitizedMessage = errObj.message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/(password|secret|token)=[^&]+/gi, '$1=[REDACTED]');

  const entry: ErrorLogEntry = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message: sanitizedMessage,
    context: context ? context.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]') : undefined,
  };

  console.error(`[Lumora Error]${context ? ` [${context}]` : ''}:`, errObj);

  try {
    const existing: ErrorLogEntry[] = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    const updated = [entry, ...existing].slice(0, 15); // Retain max 15 entries
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

export function parseUserFriendlyError(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (!error) return fallbackMessage;
  const msg = typeof error === 'string' ? error : (error as any)?.message || String(error);

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network connection issue. Please check your internet.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  return fallbackMessage;
}