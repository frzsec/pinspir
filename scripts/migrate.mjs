import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Read database URL from env or args
const targetDbUrl = process.env.DATABASE_URL || process.argv[2];

if (!targetDbUrl) {
  console.error('[Migrate] Error: Missing DATABASE_URL or database argument.');
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
