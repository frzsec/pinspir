/**
 * db-guard.ts
 *
 * Safety guard for test database URLs.
 * All integration tests MUST call assertTestDatabaseUrl() before any mutation.
 *
 * Rules enforced:
 * 1. URL must not be empty.
 * 2. The database name component must end with '_test'.
 * 3. The URL must not match DATABASE_URL (prevents accidentally mutating prod/dev).
 */

/**
 * Extract the database name from a PostgreSQL connection string.
 * Handles both URL format and path-only variants.
 */
function extractDbName(url: string): string | null {
  try {
    const parsed = new URL(url);
    // pathname is like '/finspire_test' — strip leading slash
    const dbName = parsed.pathname.replace(/^\//, '').split('?')[0];
    return dbName || null;
  } catch {
    return null;
  }
}

/**
 * Asserts that the given URL is safe to use as a disposable test database.
 * Throws immediately with a descriptive error if any rule is violated.
 *
 * @param url - The connection string to validate (e.g. TEST_DATABASE_URL)
 * @throws Error if the URL does not pass all safety checks
 */
export function assertTestDatabaseUrl(url: string): void {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      '[DB Guard] TEST_DATABASE_URL is empty or not set. ' +
      'Tests must use an explicit disposable test database.'
    );
  }

  const dbName = extractDbName(url);
  if (!dbName) {
    throw new Error(
      `[DB Guard] Cannot parse database name from URL: '${url.replace(/:([^@]+)@/, ':****@')}'. ` +
      'The URL must be a valid PostgreSQL connection string.'
    );
  }

  if (!dbName.endsWith('_test')) {
    throw new Error(
      `[DB Guard] TEST_DATABASE_URL points to database '${dbName}', which does not end with '_test'. ` +
      'Integration tests must only run against a disposable database whose name ends with _test. ' +
      `Offending URL (redacted): '${url.replace(/:([^@]+)@/, ':****@')}'`
    );
  }

  // Guard against accidentally using the production/dev database
  const productionUrl = process.env.DATABASE_URL;
  if (productionUrl && url.trim() === productionUrl.trim()) {
    throw new Error(
      '[DB Guard] TEST_DATABASE_URL is identical to DATABASE_URL. ' +
      'Tests must not run against the production or development database.'
    );
  }
}

/**
 * Convenience: extract and assert in one call. Returns the validated URL.
 * Intended for use at the top of each test file.
 *
 * @example
 * const testDbUrl = requireTestDatabaseUrl();
 * const pool = new Pool({ connectionString: testDbUrl });
 */
export function requireTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      '[DB Guard] TEST_DATABASE_URL environment variable is not set. ' +
      'Set it to a PostgreSQL URL whose database name ends with _test before running tests. ' +
      'Example: $env:TEST_DATABASE_URL="postgresql://postgres:pass@127.0.0.1:5432/finspire_test"'
    );
  }
  assertTestDatabaseUrl(url);
  return url;
}
