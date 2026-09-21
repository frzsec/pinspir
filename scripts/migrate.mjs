import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// D-01/D-02 fix: No argv fallback. DATABASE_URL must be set explicitly via environment.
// Run: $env:DATABASE_URL="postgresql://..." ; node scripts/migrate.mjs
const targetDbUrl = process.env.DATABASE_URL;

if (!targetDbUrl) {
  console.error('[Migrate] Error: DATABASE_URL environment variable is required.');
  console.error('  Set it explicitly: $env:DATABASE_URL="postgresql://user:pass@host/dbname"');
  console.error('  Never rely on a hardcoded fallback.');
  process.exit(1);
}

// Ensure password is not printed in logs
const safeUrl = targetDbUrl.replace(/:([^@]+)@/, ':****@');
console.log(`[Migrate] Running migrations against: ${safeUrl}`);

const migrationsFolder = path.resolve(repoRoot, 'src/db/migrations');
if (!fs.existsSync(migrationsFolder)) {
  console.error(`[Migrate] Error: Migrations folder not found at ${migrationsFolder}`);
  process.exit(1);
}

const pool = new Pool({
  connectionString: targetDbUrl,
  connectionTimeoutMillis: 5000,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const db = drizzle(client);
    console.log('[Migrate] Applying pending migrations...');
    await migrate(db, { migrationsFolder });
    console.log('[Migrate] SUCCESS: All migrations applied cleanly.');
  } catch (err) {
    console.error('[Migrate] FAILED to apply migrations:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
