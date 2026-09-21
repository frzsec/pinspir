import 'server-only';

const REDACTED_FIELDS = new Set([
  'passphrase',
  'password',
  'token',
  'sessiontoken',
  'authorization',
  'cookie',
  'auth_token',
  'secret',
]);

const REDACTED_TEXT = '[REDACTED]';

export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Redact potential passwords in URLs if any
    if (data.includes('://') && data.includes('@')) {
      try {
        const url = new URL(data);
        if (url.password) {
          url.password = '****';
        }
        return url.toString();
      } catch {
        return data;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (REDACTED_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = REDACTED_TEXT;
      } else {
        sanitized[key] = redactSensitiveData(value);
      }
    }
    return sanitized;
  }

  return data;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context: context ? (redactSensitiveData(context) as Record<string, unknown>) : undefined,
    };
    console.log(JSON.stringify(entry));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context: context ? (redactSensitiveData(context) as Record<string, unknown>) : undefined,
    };
    console.warn(JSON.stringify(entry));
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message }
      : { error: String(error) };

    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context: redactSensitiveData({
        ...errorDetails,
        ...(context || {}),
      }) as Record<string, unknown>,
    };
    console.error(JSON.stringify(entry));
  },
};
