import { defineConfig } from 'drizzle-kit';

// D-02 fix: No hardcoded fallback credentials.
// DATABASE_URL must be set explicitly in the environment.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    '[drizzle.config] DATABASE_URL environment variable is required. ' +
    'Run: $env:DATABASE_URL="postgresql://user:pass@host/dbname" before drizzle-kit commands.'
  );
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
