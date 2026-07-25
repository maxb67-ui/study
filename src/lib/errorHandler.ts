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
 * Logs errors in development mode to sessionStorage (cleared when closing tab).
 * Redacts sensitive data like tokens, passwords, emails, and GPA/academic goals.
 */
export function logError(error: unknown, context?: string): ErrorLogEntry {
  const rawMessage = error instanceof Error ? error.message : String(error);
  
  // Redaction patterns for PII, tokens, and sensitive academic data
  const patterns = [
    { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    { regex: /bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
    { regex: /(password|secret|token|key|api_key|auth|session|cookie)=[^&\s,)]+/gi, replacement: '$1=[REDACTED]' },
    { regex: /sb-[a-zA-Z0-9_-]{20,}/g, replacement: '[SUPABASE_TOKEN_REDACTED]' },
    { regex: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[CARD_REDACTED]' },
    { regex: /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
    { regex: /"(target_gpa|targetGpa|study_goals|learning_style)":\s*("[^"]*"|\d+(\.\d+)?)/gi, replacement: '"$1":"[REDACTED]"' },
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

  // Only output sanitized messages to console during local development
  if (import.meta.env.DEV) {
    console.error(`[Lumora Error]${sanitizedContext ? ` [${sanitizedContext}]` : ''}:`, sanitizedMessage);
  }

  // Use sessionStorage instead of persistent localStorage, and enforce non-prod check
  if (!IS_PROD) {
    try {
      const existingRaw = sessionStorage.getItem(ERROR_LOG_KEY);
      const existing: ErrorLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [entry, ...existing].slice(0, 10);
      sessionStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updated));
    } catch (e) {}
  }

  return entry;
}

export function getErrorLogs(): ErrorLogEntry[] {
  if (IS_PROD) return [];
  
  try {
    const raw = sessionStorage.getItem(ERROR_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearErrorLogs(): void {
  try {
    sessionStorage.removeItem(ERROR_LOG_KEY);
  } catch {}
}

export function parseUserFriendlyError(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (!error) return fallbackMessage;
  const msg = typeof error === 'string' ? error : (error as any)?.message || String(error);

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (msg.includes('Invalid login credentials') || msg.includes('Incorrect current password')) {
    return 'Invalid credentials. Please verify your details.';
  }
  return fallbackMessage;
}