import 'server-only';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  testDatabaseUrl?: string;
  databaseMaxConnections: number;
  databaseConnectionTimeoutMs: number;
  appUrl: string;
}

const REDACTED_VALUE = '[REDACTED]';

export function redactSensitiveUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return REDACTED_VALUE;
  }
}

export function validateAndLoadConfig(overrides?: Partial<Record<string, string>>): AppConfig {
  const env = { ...process.env, ...overrides };

  const nodeEnv = (env.NODE_ENV || 'development') as 'development' | 'test' | 'production';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`[Finspire Config] Invalid NODE_ENV: '${nodeEnv}'`);
  }

  const databaseUrl =
    env.DATABASE_URL ||
    env.TEST_DATABASE_URL ||
    'postgresql://postgres:fairuz@127.0.0.1:5432/finspire_test';


  const testDatabaseUrl = env.TEST_DATABASE_URL;

  const maxConnectionsRaw = env.DATABASE_MAX_CONNECTIONS || '20';
  const databaseMaxConnections = parseInt(maxConnectionsRaw, 10);
  if (isNaN(databaseMaxConnections) || databaseMaxConnections <= 0) {
    throw new Error(`[Finspire Config] Invalid DATABASE_MAX_CONNECTIONS: '${maxConnectionsRaw}'`);
  }

  const timeoutMsRaw = env.DATABASE_CONNECTION_TIMEOUT_MS || '5000';
  const databaseConnectionTimeoutMs = parseInt(timeoutMsRaw, 10);
  if (isNaN(databaseConnectionTimeoutMs) || databaseConnectionTimeoutMs <= 0) {
    throw new Error(`[Finspire Config] Invalid DATABASE_CONNECTION_TIMEOUT_MS: '${timeoutMsRaw}'`);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    nodeEnv,
    databaseUrl: databaseUrl || '',
    testDatabaseUrl,
    databaseMaxConnections,
    databaseConnectionTimeoutMs,
    appUrl,
  };
}

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = validateAndLoadConfig();
  }
  return cachedConfig;
}
