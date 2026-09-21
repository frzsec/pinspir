import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ensureContentLoaded, getActiveReleaseManifest } from '../../src/lib/game/content-loader.ts';

const { Pool } = pg;

const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  throw new Error('[DB Guard] TEST_DATABASE_URL is required.');
}
process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_SECRET = 'test_secret_for_better_auth_123456';

const pool = new Pool({ connectionString: testDbUrl });

before(async () => {
  // Ensure DB is seeded by running the seeder script logic if needed,
  // but tests assume DB is seeded by test runner.
});

after(async () => {
  await pool.end();
});

test('T-06, T-07: Content loader hash mismatch and active release resolve', async (t) => {
  await t.test('Active release can be loaded via ensureContentLoaded', async () => {
    await ensureContentLoaded();
    const manifest = getActiveReleaseManifest();
    assert.ok(manifest, 'Manifest should be loaded');
    assert.equal(manifest.releaseId, 'pilot-v1-draft', 'Default seed is pilot-v1-draft');
  });

  await t.test('Hash mismatch throws integrity failure', async () => {
    // 1. Manually tamper the database hash
    await pool.query(
      `UPDATE content_releases SET manifest_sha256 = 'badhash123' WHERE status = 'active'`
    );

    // 2. ensureContentLoaded should fail
    await assert.rejects(
      async () => {
        await ensureContentLoaded();
      },
      /Content integrity failure/
    );

    // 3. Restore the hash
    const root = process.cwd();
    const releaseDir = path.resolve(root, 'content/releases/pilot-v1-draft');
    const manifestPath = path.resolve(releaseDir, 'manifest.json');
    const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
    const correctHash = crypto.createHash('sha256').update(manifestRaw).digest('hex');

    await pool.query(
      `UPDATE content_releases SET manifest_sha256 = $1 WHERE status = 'active'`,
      [correctHash]
    );

    // 4. Should succeed again
    await ensureContentLoaded();
  });
});

test('T-10: Seed idempotency hash detection', async (t) => {
  const { execSync } = await import('node:child_process');
  const scriptPath = path.resolve(process.cwd(), 'scripts/seed-pilot-content.mjs');
  
  await t.test('Idempotent success if hash matches', () => {
    // Should run successfully without throwing
    const out = execSync(`node ${scriptPath}`, { env: { ...process.env }, encoding: 'utf8' });
    assert.match(out, /already exists and hash matches/);
  });

  await t.test('Fatal conflict if hash differs', async () => {
    // Break the hash in DB temporarily
    await pool.query(
      `UPDATE content_releases SET manifest_sha256 = 'badhash123' WHERE status = 'active'`
    );

    let error;
    try {
      execSync(`node ${scriptPath}`, { env: { ...process.env }, encoding: 'utf8' });
    } catch (err) {
      error = err;
    }

    assert.ok(error, 'Seeder must fail and exit non-zero if hash mismatches');
    assert.match(error.stderr || error.stdout, /FATAL CONFLICT/);

    // Restore hash for other tests
    const manifestPath = path.resolve(process.cwd(), 'content/releases/pilot-v1-draft/manifest.json');
    const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
    const correctHash = crypto.createHash('sha256').update(manifestRaw).digest('hex');

    await pool.query(
      `UPDATE content_releases SET manifest_sha256 = $1 WHERE status = 'active'`,
      [correctHash]
    );
  });
});
