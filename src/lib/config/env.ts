import 'server-only';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  testDatabaseUrl?: string;
  databaseMaxConnections: number;
  databaseConnectionTimeoutMs: number;
  appUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
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

  // D-01 fix: No hardcoded fallback credentials. Fail-fast if env var is missing.
  // In test mode, TEST_DATABASE_URL is mandatory.
  let databaseUrl: string;
  if (nodeEnv === 'test') {
    const testUrl = env.TEST_DATABASE_URL;
    if (!testUrl) {
      throw new Error(
        '[Finspire Config] TEST_DATABASE_URL is required when NODE_ENV=test. ' +
        'Never use a non-test database for automated tests.'
      );
    }
    databaseUrl = testUrl;
  } else {
    const prodUrl = env.DATABASE_URL;
    if (!prodUrl) {
      throw new Error(
        '[Finspire Config] DATABASE_URL is required. ' +
        'Set this environment variable — do not use hardcoded fallback credentials.'
      );
    }
    databaseUrl = prodUrl;
  }

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

  // Better Auth credentials — required in all envs
  const betterAuthSecret = env.BETTER_AUTH_SECRET;
  if (!betterAuthSecret) {
    throw new Error(
      '[Finspire Config] BETTER_AUTH_SECRET is required. ' +
      'Set a random secret of at least 32 characters.'
    );
  }
  const betterAuthUrl = env.BETTER_AUTH_URL || appUrl;

  return {
    nodeEnv,
    databaseUrl,
    testDatabaseUrl,
    databaseMaxConnections,
    databaseConnectionTimeoutMs,
    appUrl,
    betterAuthSecret,
    betterAuthUrl,
  };
}

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = validateAndLoadConfig();
  }
  return cachedConfig;
}

/** Reset cached config — for use in tests only. */
export function _resetConfigCache(): void {
  cachedConfig = null;
}
