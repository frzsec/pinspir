import fs from 'fs';
import pg from 'pg';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  if (line.includes('=')) {
    const [k, v] = line.split('=');
    env[k.trim()] = v.trim();
  }
}

async function checkMigrations(url, name) {
  if (!url) {
    console.log(`[${name}] URL not set`);
    return;
  }
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at ASC');
    console.log(`[${name}] Applied migrations:`);
    console.table(res.rows);
  } catch (err) {
    console.log(`[${name}] Error checking migrations:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await checkMigrations(env.DATABASE_URL, 'DEV_DB');
  await checkMigrations(env.TEST_DATABASE_URL, 'TEST_DB');
}

main();
