"use client";

export type ErrorLogEntry = {
  id: string;
  timestamp: string;
  message: string;
  context?: string;
};

const ERROR_LOG_KEY = 'lumora_error_logs_v1';
const IS_PROD = import.meta.env.PROD;

/**
 * Logs errors locally for diagnostic review.
 * Aggressively scrubs sensitive data like tokens, passwords, and PII.
 */
export function logError(error: unknown, context?: string): ErrorLogEntry {
  const rawMessage = error instanceof Error ? error.message : String(error);
  
  // Enhanced redaction patterns for PII and secrets
  const patterns = [
    { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    { regex: /bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
    { regex: /(password|secret|token|key|api_key|auth|session|cookie)=[^&\s,)]+/gi, replacement: '$1=[REDACTED]' },
    { regex: /sb-[a-zA-Z0-9_-]{20,}/g, replacement: '[SUPABASE_TOKEN_REDACTED]' },
    { regex: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[CARD_REDACTED]' },
    { regex: /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' }
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

  // Always log to console for developers
  console.error(`[Lumora Error]${context ? ` [${context}]` : ''}:`, error);

  // SECURITY: Only persist logs to localStorage in development mode.
  if (!IS_PROD) {
    try {
      const existingRaw = localStorage.getItem(ERROR_LOG_KEY);
      const existing: ErrorLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [entry, ...existing].slice(0, 10);
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  return entry;
}

export function getErrorLogs(): ErrorLogEntry[] {
  if (IS_PROD) return [];
  
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
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