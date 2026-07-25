"use client";

export type ErrorLogEntry = {
  id: string;
  timestamp: string;
  message: string;
  context?: string;
};

const ERROR_LOG_KEY = 'lumora_error_logs_v1';

/**
 * Logs errors locally for diagnostic review.
 * Aggressively scrubs sensitive data like tokens, passwords, and PII.
 */
export function logError(error: unknown, context?: string): ErrorLogEntry {
  // Extract essential message only, avoiding full object serialization
  const rawMessage = error instanceof Error ? error.message : String(error);
  
  // Broader redaction patterns
  const patterns = [
    { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    { regex: /bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
    { regex: /(password|secret|token|key|api_key|auth)=[^&\s,)]+/gi, replacement: '$1=[REDACTED]' },
    { regex: /sb-[a-zA-Z0-9_-]{20,}/g, replacement: '[SUPABASE_TOKEN_REDACTED]' }
  ];

  let sanitizedMessage = rawMessage;
  let sanitizedContext = context || '';

  patterns.forEach(({ regex, replacement }) => {
    sanitizedMessage = sanitizedMessage.replace(regex, replacement);
    sanitizedContext = sanitizedContext.replace(regex, replacement);
  });

  const entry: ErrorLogEntry = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message: sanitizedMessage,
    context: sanitizedContext || undefined,
  };

  // Log clean error to console for dev, but keep storage scrubbed
  console.error(`[Lumora Error]${context ? ` [${context}]` : ''}:`, error);

  try {
    const existing: ErrorLogEntry[] = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    // Only keep last 10 entries to minimize local footprint
    const updated = [entry, ...existing].slice(0, 10);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    // Fail silently if localStorage is restricted
  }

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
  if (msg.includes('Invalid login credentials') || msg.includes('Incorrect current password')) {
    return 'Invalid credentials. Please verify your details.';
  }
  return fallbackMessage;
}