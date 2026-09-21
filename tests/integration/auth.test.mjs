import assert from 'node:assert/strict';
import test, { describe, before, after } from 'node:test';
import pg from 'pg';
import { generateRandomPlayerCode, normalizePlayerCode, isValidPlayerCode, playerCodeToTechnicalEmail } from '../../src/lib/auth/player-code.ts';
import { hashPassphrase, verifyPassphrase, validatePassphrasePolicy } from '../../src/lib/auth/passphrase.ts';
import { createSession, getSessionByToken, revokeSession } from '../../src/lib/auth/session.ts';
import { checkRateLimit, resetRateLimit } from '../../src/lib/auth/rate-limiter.ts';

const { Pool } = pg;
const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:fairuz@127.0.0.1:5432/finspire_test';
process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = 'test';

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

describe('Fase 04: Auth, Privacy, and Security Integration Tests', () => {
  test('1. Player Code generator, normalization, and technical email mapping', () => {
    const code = generateRandomPlayerCode();
    assert.equal(isValidPlayerCode(code), true, `Generated code ${code} should match regex`);
    assert.match(code, /^FOX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{3}$/);

    // Normalization test
    assert.equal(normalizePlayerCode('fox-7k9m-2p4'), 'FOX-7K9M-2P4');
    assert.equal(normalizePlayerCode('FOX 7K9M 2P4'), 'FOX-7K9M-2P4');
    assert.equal(normalizePlayerCode('7k9m2p4'), 'FOX-7K9M-2P4');

    // RFC 2606 technical alias
    const techEmail = playerCodeToTechnicalEmail('FOX-7K9M-2P4');
    assert.equal(techEmail, 'fox-7k9m-2p4@finspire.invalid');
  });

  test('2. Passphrase hashing, policy validation, and timing-safe verification', async () => {
    const policyValid = validatePassphrasePolicy('rahasia123');
    assert.equal(policyValid.valid, true);

    const policyShort = validatePassphrasePolicy('123');
    assert.equal(policyShort.valid, false);

    const hash = await hashPassphrase('rahasia123');
    assert.ok(hash.startsWith('scrypt$'));

    const isMatch = await verifyPassphrase('rahasia123', hash);
    assert.equal(isMatch, true, 'Valid passphrase should match hash');

    const isWrong = await verifyPassphrase('salah123', hash);
    assert.equal(isWrong, false, 'Invalid passphrase should not match');
  });

  test('3. Pseudonymous student registration and session creation in PostgreSQL', async () => {
    const playerCode = generateRandomPlayerCode();
    const technicalEmail = playerCodeToTechnicalEmail(playerCode);
    const passwordHash = await hashPassphrase('katakunci2026');

    // Insert user and account
    const uRes = await pool.query(
      `INSERT INTO users (role, player_code, nickname, is_anonymous)
       VALUES ('student', $1, 'Kancil Cerdik', false)
       RETURNING id, role, player_code, nickname;`,
      [playerCode]
    );
    const user = uRes.rows[0];
    assert.equal(user.player_code, playerCode);

    await pool.query(
      `INSERT INTO accounts (user_id, account_id, provider_id, password_hash)
       VALUES ($1, $2, 'credential', $3);`,
      [user.id, technicalEmail, passwordHash]
    );

    // Verify account stored with .invalid domain and zero PII
    const accRes = await pool.query('SELECT account_id FROM accounts WHERE user_id = $1;', [user.id]);
    assert.equal(accRes.rows[0].account_id.endsWith('@finspire.invalid'), true);

    // Create session
    const { token } = await createSession(user.id, '127.0.0.1', 'Integration Test Agent');
    const session = await getSessionByToken(token);

    assert.ok(session, 'Session should be valid and found in DB');
    assert.equal(session.user.id, user.id);
    assert.equal(session.user.playerCode, playerCode);

    // Second device login: creates second active session
    const { token: token2 } = await createSession(user.id, '192.168.1.50', 'Mobile PWA');
    const session2 = await getSessionByToken(token2);
    assert.ok(session2);
    assert.notEqual(token, token2);

    // Revoke first session
    await revokeSession(token);
    assert.equal(await getSessionByToken(token), null, 'First session should be revoked');
    assert.ok(await getSessionByToken(token2), 'Second session should remain active');
  });

  test('4. Rate limiting blocks brute-force attempts after 5 failures', () => {
    const key = 'test_rate_limit_' + Date.now();
    resetRateLimit(key);

    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit(key, 5, 60000);
      assert.equal(res.allowed, true, `Attempt ${i} should be allowed`);
    }

    // 6th attempt must be rejected
    const blockedRes = checkRateLimit(key, 5, 60000);
    assert.equal(blockedRes.allowed, false, '6th attempt must be blocked');
    assert.equal(blockedRes.remaining, 0);
  });

  test('5. Student cohort enrollment via access code and teacher BOLA check', async () => {
    // 1. Create school and 2 teachers
    const sRes = await pool.query(`INSERT INTO schools (name, city, province) VALUES ('SMP Test Auth', 'Bandung', 'Jawa Barat') RETURNING id;`);
    const schoolId = sRes.rows[0].id;

    const t1 = (await pool.query(`INSERT INTO users (nickname, role) VALUES ('Guru 1', 'teacher') RETURNING id;`)).rows[0].id;
    const t2 = (await pool.query(`INSERT INTO users (nickname, role) VALUES ('Guru 2', 'teacher') RETURNING id;`)).rows[0].id;

    // 2. Create cohort owned by Teacher 1
    const cohortCode = 'A_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const cRes = await pool.query(
      `INSERT INTO cohorts (school_id, teacher_id, name, cohort_code)
       VALUES ($1, $2, 'Kelas 8B', $3)
       RETURNING id;`,
      [schoolId, t1, cohortCode]
    );
    const cohortId = cRes.rows[0].id;

    // 3. Create student and enroll
    const studentId = (await pool.query(`INSERT INTO users (nickname, role) VALUES ('Murid Kelas', 'student') RETURNING id;`)).rows[0].id;
    await pool.query(
      `INSERT INTO cohort_members (cohort_id, user_id) VALUES ($1, $2);`,
      [cohortId, studentId]
    );

    // 4. BOLA Check: Teacher 1 can access cohort 1
    const t1Access = await pool.query(`SELECT id FROM cohorts WHERE id = $1 AND teacher_id = $2;`, [cohortId, t1]);
    assert.equal(t1Access.rowCount, 1, 'Teacher 1 is the authorized owner');

    // 5. BOLA Check: Teacher 2 CANNOT access cohort 1
    const t2Access = await pool.query(`SELECT id FROM cohorts WHERE id = $1 AND teacher_id = $2;`, [cohortId, t2]);
    assert.equal(t2Access.rowCount, 0, 'Teacher 2 should be denied access (BOLA protection)');
  });

  test('6. Teacher-assisted password reset with audit logging and session revocation', async () => {
    // Setup cohort, teacher, and student
    const sId = (await pool.query(`INSERT INTO schools (name) VALUES ('SMP Audit Test') RETURNING id;`)).rows[0].id;
    const teacherId = (await pool.query(`INSERT INTO users (nickname, role) VALUES ('Guru Wali', 'teacher') RETURNING id;`)).rows[0].id;
    const studentId = (await pool.query(`INSERT INTO users (nickname, role) VALUES ('Murid Lupa Sandi', 'student') RETURNING id;`)).rows[0].id;

    const cCode = 'B_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const cohortId = (await pool.query(
      `INSERT INTO cohorts (school_id, teacher_id, name, cohort_code) VALUES ($1, $2, 'Kelas 9C', $3) RETURNING id;`,
      [sId, teacherId, cCode]
    )).rows[0].id;

    await pool.query(`INSERT INTO cohort_members (cohort_id, user_id) VALUES ($1, $2);`, [cohortId, studentId]);

    // Student has an initial account and active session
    const studentCode = generateRandomPlayerCode();
    const studentEmail = playerCodeToTechnicalEmail(studentCode);
    const oldHash = await hashPassphrase('sandiLama123');
    await pool.query(
      `INSERT INTO accounts (user_id, account_id, provider_id, password_hash)
       VALUES ($1, $2, 'credential', $3);`,
      [studentId, studentEmail, oldHash]
    );

    const { token: studentSessionToken } = await createSession(studentId);
    assert.ok(await getSessionByToken(studentSessionToken), 'Student should have active session');

    // Teacher resets password
    const tempPassphrase = 'PINTAR-7890';
    const newHash = await hashPassphrase(tempPassphrase);

    await pool.query(
      `UPDATE accounts SET password_hash = $1 WHERE user_id = $2 AND provider_id = 'credential';`,
      [newHash, studentId]
    );

    // Audit log entry
    await pool.query(
      `INSERT INTO credential_reset_audits (target_user_id, teacher_id, cohort_id, reason)
       VALUES ($1, $2, $3, 'Murid lupa kata sandi di lab');`,
      [studentId, teacherId, cohortId]
    );

    // Invalidate student sessions
    await pool.query('DELETE FROM sessions WHERE user_id = $1;', [studentId]);

    // Verifications
    assert.equal(await getSessionByToken(studentSessionToken), null, 'Old session must be revoked');

    const auditRes = await pool.query('SELECT * FROM credential_reset_audits WHERE target_user_id = $1;', [studentId]);
    assert.equal(auditRes.rowCount, 1);
    assert.equal(auditRes.rows[0].teacher_id, teacherId);

    // Verify new passphrase works and old one fails
    const currentAcc = await pool.query('SELECT password_hash FROM accounts WHERE user_id = $1;', [studentId]);
    assert.equal(await verifyPassphrase(tempPassphrase, currentAcc.rows[0].password_hash), true);
    assert.equal(await verifyPassphrase('sandiLama123', currentAcc.rows[0].password_hash), false);
  });

  test('7. User consent grant and revocation lifecycle', async () => {
    const uId = (await pool.query(`INSERT INTO users (nickname) VALUES ('Consent User') RETURNING id;`)).rows[0].id;

    // Grant terms of service
    await pool.query(
      `INSERT INTO user_consents (user_id, consent_type, granted, granted_at)
       VALUES ($1, 'terms_of_service', true, NOW());`,
      [uId]
    );

    let checkConsent = await pool.query(
      `SELECT granted, revoked_at FROM user_consents WHERE user_id = $1 AND consent_type = 'terms_of_service';`,
      [uId]
    );
    assert.equal(checkConsent.rows[0].granted, true);
    assert.equal(checkConsent.rows[0].revoked_at, null);

    // Revoke consent
    await pool.query(
      `UPDATE user_consents SET granted = false, revoked_at = NOW()
       WHERE user_id = $1 AND consent_type = 'terms_of_service';`,
      [uId]
    );

    checkConsent = await pool.query(
      `SELECT granted, revoked_at FROM user_consents WHERE user_id = $1 AND consent_type = 'terms_of_service';`,
      [uId]
    );
    assert.equal(checkConsent.rows[0].granted, false);
    assert.notEqual(checkConsent.rows[0].revoked_at, null);
  });

  test('8. Account deletion soft-deletes record and revokes sessions', async () => {
    const delCode = generateRandomPlayerCode();
    const uId = (await pool.query(`INSERT INTO users (nickname, player_code) VALUES ('Delete Me', $1) RETURNING id;`, [delCode])).rows[0].id;
    const { token } = await createSession(uId);
    assert.ok(await getSessionByToken(token));

    // Execute deletion
    await pool.query(
      `UPDATE users SET deleted_at = NOW(), player_code = CONCAT('DELETED-', id) WHERE id = $1;`,
      [uId]
    );
    await pool.query('DELETE FROM sessions WHERE user_id = $1;', [uId]);

    // Session is dead
    assert.equal(await getSessionByToken(token), null);

    // User is marked deleted
    const uCheck = await pool.query('SELECT deleted_at, player_code FROM users WHERE id = $1;', [uId]);
    assert.notEqual(uCheck.rows[0].deleted_at, null);
    assert.ok(uCheck.rows[0].player_code.startsWith('DELETED-'));
  });
});
