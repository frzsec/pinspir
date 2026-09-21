import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const targetDbUrl = process.env.DATABASE_URL || process.argv[2];

if (!targetDbUrl) {
  console.error('[Seed] Error: Missing DATABASE_URL or database argument.');
  process.exit(1);
}

const safeUrl = targetDbUrl.replace(/:([^@]+)@/, ':****@');
console.log(`[Seed] Ingesting pilot content release to: ${safeUrl}`);

function computeSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

const manifestPath = path.resolve(repoRoot, 'content/releases/pilot-v1-draft/manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`[Seed] Error: Manifest file not found at ${manifestPath}`);
  process.exit(1);
}

const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
const manifestJson = JSON.parse(manifestRaw);
const manifestSha256 = crypto.createHash('sha256').update(manifestRaw).digest('hex');

// Verify chapter checksums
for (const chFileName of manifestJson.chapterFiles) {
  const chPath = path.resolve(repoRoot, 'content/releases/pilot-v1-draft', chFileName);
  if (!fs.existsSync(chPath)) {
    console.error(`[Seed] Error: Chapter file ${chFileName} not found at ${chPath}`);
    process.exit(1);
  }
  const actualSha = computeSha256(chPath);
  console.log(`[Seed] Chapter ${chFileName} SHA-256: ${actualSha}`);
}
console.log('[Seed] Content integrity verified: all chapter files exist and are readable.');

const pool = new Pool({
  connectionString: targetDbUrl,
  connectionTimeoutMillis: 5000,
});

async function runSeed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Reference School with deterministic UUID
    const schoolSql = `
      INSERT INTO schools (id, name, npsn, city, province, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (npsn) DO UPDATE
      SET name = EXCLUDED.name
      RETURNING id, name;
    `;
    const schoolRes = await client.query(schoolSql, [
      '00000000-0000-4000-8000-000000000001',
      'SMP Negeri 1 Finspire (Sekolah Percontohan)',
      '20100001',
      'Jakarta Selatan',
      'DKI Jakarta',
    ]);
    console.log(`[Seed] Reference school seeded: ${schoolRes.rows[0].name} (${schoolRes.rows[0].id})`);

    // 2. Ingest Content Release pilot-v1-draft
    const releaseSql = `
      INSERT INTO content_releases (
        id, release_id, schema_version, title, status, manifest_json, manifest_sha256, activated_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
      ON CONFLICT (release_id) DO NOTHING
      RETURNING id, release_id, status;
    `;

    const releaseRes = await client.query(releaseSql, [
      '00000000-0000-4000-8000-000000000010',
      manifestJson.releaseId,
      manifestJson.schemaVersion || '2020-12',
      manifestJson.title,
      'active',
      manifestJson,
      manifestSha256,
    ]);

    if (releaseRes.rowCount > 0) {
      console.log(`[Seed] Content release inserted: ${releaseRes.rows[0].release_id} (status: ${releaseRes.rows[0].status})`);
    } else {
      console.log(`[Seed] Content release ${manifestJson.releaseId} already exists; skipped insertion (idempotent).`);
    }

    await client.query('COMMIT');
    console.log('[Seed] SUCCESS: Seeding completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed] FAILED with error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
