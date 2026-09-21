import assert from 'node:assert/strict';
import test, { describe, before, after } from 'node:test';
import pg from 'pg';

const { Pool } = pg;
const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:fairuz@127.0.0.1:5432/finspire_test';

let pool;

before(async () => {
  pool = new Pool({
    connectionString: testDbUrl,
    connectionTimeoutMillis: 5000,
  });
});

after(async () => {
  if (pool) {
    await pool.end();
  }
});

describe('PostgreSQL Integration Tests (Real DB)', () => {
  test('1. Reference School and Pilot Content Release exist in DB', async () => {
    const schoolRes = await pool.query('SELECT * FROM schools WHERE npsn = $1;', ['20100001']);
    assert.equal(schoolRes.rowCount, 1, 'Reference school should be found in DB');
    const school = schoolRes.rows[0];
    assert.equal(school.npsn, '20100001');
    assert.equal(school.name, 'SMP Negeri 1 Finspire (Sekolah Percontohan)');

    const releaseRes = await pool.query('SELECT * FROM content_releases WHERE release_id = $1;', ['pilot-v1-draft']);
    assert.equal(releaseRes.rowCount, 1, 'Pilot content release should be found in DB');
    const release = releaseRes.rows[0];
    assert.equal(release.status, 'active');
  });

  test('2. Check constraints enforce non-negative values', async () => {
    // Negative reward amount must fail
    await assert.rejects(
      async () => {
        await pool.query(`
          INSERT INTO reward_ledger (user_id, release_id, source_node_id, reward_type, amount, reason)
          VALUES ('00000000-0000-4000-8000-000000000001', 'pilot-v1-draft', 'node_1', 'xp', -50, 'invalid');
        `);
      },
      /chk_reward_amount_non_negative/
    );

    // Negative mastery score must fail
    await assert.rejects(
      async () => {
        await pool.query(`
          INSERT INTO playthrough_attempts (release_id, chapter_id, score_mastery)
          VALUES ('pilot-v1-draft', 'chapter-01', -10);
        `);
      },
      /chk_attempts_score_non_negative/
    );
  });

  test('3. Append-only reward ledger prevents double rewarding via UNIQUE constraint', async () => {
    // Create a temporary test user
    const userRes = await pool.query(`
      INSERT INTO users (nickname, role) VALUES ('Murid Test 1', 'student') RETURNING id;
    `);
    const testUserId = userRes.rows[0].id;

    // First reward insert: SUCCESS
    await pool.query(`
      INSERT INTO reward_ledger (user_id, release_id, source_node_id, reward_type, amount, reason)
      VALUES ($1, 'pilot-v1-draft', 'node_ch1_boss', 'star', 3, 'First pass');
    `, [testUserId]);

    // Second reward insert for SAME source node & reward type: MUST REJECT
    await assert.rejects(
      async () => {
        await pool.query(`
          INSERT INTO reward_ledger (user_id, release_id, source_node_id, reward_type, amount, reason)
          VALUES ($1, 'pilot-v1-draft', 'node_ch1_boss', 'star', 3, 'Replay attempt');
        `, [testUserId]);
      },
      /uq_reward_ledger_source/
    );
  });

  test('4. First-accepted decision wins: gameplay_actions prevents conflicting choices for same node', async () => {
    // Create attempt
    const attemptRes = await pool.query(`
      INSERT INTO playthrough_attempts (release_id, chapter_id)
      VALUES ('pilot-v1-draft', 'chapter-01')
      RETURNING id;
    `);
    const attemptId = attemptRes.rows[0].id;

    // First decision: accepted
    await pool.query(`
      INSERT INTO gameplay_actions (attempt_id, action_id, client_sequence, scene_node_id, choice_id, occurred_at)
      VALUES ($1, gen_random_uuid(), 1, 'scene_pinjol_offer', 'tolak_tawaran', NOW());
    `, [attemptId]);

    // Second decision for same scene_node_id in same attempt: MUST REJECT (First accepted wins)
    await assert.rejects(
      async () => {
        await pool.query(`
          INSERT INTO gameplay_actions (attempt_id, action_id, client_sequence, scene_node_id, choice_id, occurred_at)
          VALUES ($1, gen_random_uuid(), 2, 'scene_pinjol_offer', 'terima_tawaran', NOW());
        `, [attemptId]);
      },
      /uq_gameplay_attempt_node/
    );
  });

  test('5. Foreign key cascade and restrict policies function correctly', async () => {
    // Create user and account
    const uRes = await pool.query(`INSERT INTO users (nickname) VALUES ('Cascade User') RETURNING id;`);
    const uId = uRes.rows[0].id;

    const accRes = await pool.query(`
      INSERT INTO accounts (user_id, account_id, provider_id)
      VALUES ($1, 'cascade@finspire.invalid', 'credential')
      RETURNING id;
    `, [uId]);
    const accId = accRes.rows[0].id;

    // Delete user -> account must be cascade deleted
    await pool.query(`DELETE FROM users WHERE id = $1;`, [uId]);
    const checkAcc = await pool.query(`SELECT id FROM accounts WHERE id = $1;`, [accId]);
    assert.equal(checkAcc.rowCount, 0, 'Account should be deleted via cascade');

    // Restrict policy: School cannot be deleted if referenced by cohort
    const schRes = await pool.query(`INSERT INTO schools (name) VALUES ('Sekolah Restrict') RETURNING id;`);
    const schId = schRes.rows[0].id;

    const tRes = await pool.query(`INSERT INTO users (nickname, role) VALUES ('Guru Restrict', 'teacher') RETURNING id;`);
    const teacherId = tRes.rows[0].id;

    const cohortCode = 'T_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await pool.query(`
      INSERT INTO cohorts (school_id, teacher_id, name, cohort_code)
      VALUES ($1, $2, 'Kelas 7A', $3);
    `, [schId, teacherId, cohortCode]);

    await assert.rejects(
      async () => {
        await pool.query(`DELETE FROM schools WHERE id = $1;`, [schId]);
      },
      /cohorts_school_id_schools_id_fk/
    );
  });

  test('6. Database transaction rollback helper operates atomically', async () => {
    const userCountBefore = (await pool.query('SELECT count(*) FROM users;')).rows[0].count;

    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO users (nickname) VALUES ('Will Rollback');`);
        // Intentionally trigger an error
        throw new Error('Simulated transaction failure');
      } catch {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    } catch {
      // Ignored
    }

    const userCountAfter = (await pool.query('SELECT count(*) FROM users;')).rows[0].count;
    assert.equal(userCountAfter, userCountBefore, 'User count must remain unchanged after rollback');
  });

  test('7. Readiness connectivity probe succeeds on healthy database', async () => {
    const readyRes = await pool.query('SELECT 1 AS ready_check;');
    assert.equal(readyRes.rows[0].ready_check, 1);
  });
});
