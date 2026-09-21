import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';

// D-02b: Fail-fast if TEST_DATABASE_URL is missing or not a _test database.
const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl) {
  throw new Error('[DB Guard] TEST_DATABASE_URL is required. Set it before running integration tests.');
}
if (!new URL(testDbUrl).pathname.replace(/^\//, '').endsWith('_test')) {
  throw new Error(`[DB Guard] TEST_DATABASE_URL must point to a database ending with _test. Got: ${new URL(testDbUrl).pathname}`);
}
process.env.DATABASE_URL = testDbUrl;
process.env.NODE_ENV = 'test';

const { Pool } = pg;
const pool = new Pool({ connectionString: testDbUrl });
process.env.BETTER_AUTH_SECRET = 'test_secret_for_better_auth_123456';

// Import route handlers
import { POST as registerRoute } from '../../src/app/api/v1/auth/pseudonymous/register/route.ts';
import { GET as bootstrapRoute } from '../../src/app/api/v1/bootstrap/route.ts';
import { POST as syncRoute } from '../../src/app/api/v1/sync/route.ts';
import { GET as bundleRoute } from '../../src/app/api/v1/content/releases/[releaseId]/bundle/route.ts';
import { GET as chaptersRoute } from '../../src/app/api/v1/content/chapters/route.ts';
import { GET as leaderboardRoute } from '../../src/app/api/v1/schools/cohorts/[id]/leaderboard/route.ts';
import { POST as analyticsRoute } from '../../src/app/api/v1/analytics/events/route.ts';
import { POST as exportRoute } from '../../src/app/api/v1/consent/export/route.ts';
import { DELETE as deleteAccountRoute } from '../../src/app/api/v1/consent/account/route.ts';
import { POST as grantConsentRoute } from '../../src/app/api/v1/consent/grant/route.ts';
import { POST as joinCohortRoute } from '../../src/app/api/v1/schools/cohorts/join/route.ts';

import { ensureContentLoaded } from '../../src/lib/game/content-loader';

test('Fase 07: Headless Journey E2E Integration Suite', async (t) => {
  await ensureContentLoaded();
  let sessionCookie = '';
  let studentUser = null;
  let referenceCohortId = null;

  // Setup reference school, teacher, and cohort in DB
  const setupRes = await pool.query(`
    INSERT INTO schools (id, name, npsn, city, province)
    VALUES ('00000000-0000-4000-8000-000000000001', 'SMP Negeri 1 Finspire (Sekolah Percontohan)', '20100001', 'Jakarta', 'DKI Jakarta')
    ON CONFLICT (npsn) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;

  `);
  const schoolId = setupRes.rows[0].id;

  const teacherRes = await pool.query(`
    INSERT INTO users (id, nickname, role)
    VALUES ('00000000-0000-4000-8000-000000000002', 'Guru Pembimbing', 'teacher')
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname
    RETURNING id;
  `);
  const teacherId = teacherRes.rows[0].id;

  const cohortRes = await pool.query(`
    INSERT INTO cohorts (id, school_id, teacher_id, name, cohort_code, is_active)
    VALUES ('00000000-0000-4000-8000-000000000020', $1, $2, 'Kelas 7A Pilot', '7APILOT', true)
    ON CONFLICT (cohort_code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `, [schoolId, teacherId]);
  referenceCohortId = cohortRes.rows[0].id;


  // Helper to construct authenticated NextRequest
  const makeAuthReq = (url, method = 'GET', body = null, headers = {}) => {
    const reqHeaders = new Headers(headers);
    if (sessionCookie) {
      reqHeaders.set('cookie', sessionCookie);
    }
    const init = {
      method,
      headers: reqHeaders,
    };
    if (body) {
      reqHeaders.set('content-type', 'application/json');
      init.body = JSON.stringify(body);
    }
    return new NextRequest(url, init);
  };

  await t.test('1. Student Pseudonymous Registration & Session Cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/pseudonymous/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nickname: 'Pemain Cilik',
        passphrase: 'KataSandiKuat2026',
        cohortAccessCode: '7APILOT',
      }),
    });

    const res = await registerRoute(req);
    assert.equal(res.status, 201);
    const data = await res.json();

    assert.ok(data.user.id);
    assert.ok(data.user.playerCode);
    assert.equal(data.user.role, 'student');
    studentUser = data.user;

    // Extract session cookie from Set-Cookie header
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header must be present');
    assert.ok(setCookie.includes('finspire_session='));
    sessionCookie = setCookie.split(';')[0];
  });

  await t.test('2. Grant Consent & Bootstrap Session', async () => {
    // Grant consent
    const consentReq = makeAuthReq('http://localhost:3000/api/v1/consent/grant', 'POST', {
      consentType: 'terms_of_service',
      policyVersion: '2026.03-v1',
      purpose: 'Pelaksanaan pilot edukasi finansial sekolah',
    });
    const consentRes = await grantConsentRoute(consentReq);
    assert.equal(consentRes.status, 200);
    // Join cohort
    const joinReq = makeAuthReq('http://localhost:3000/api/v1/schools/cohorts/join', 'POST', {
      cohortCode: '7APILOT',
    });
    const joinRes = await joinCohortRoute(joinReq);
    assert.equal(joinRes.status, 200);

    // Bootstrap

    const bootReq = makeAuthReq('http://localhost:3000/api/v1/bootstrap');
    const bootRes = await bootstrapRoute(bootReq);
    assert.equal(bootRes.status, 200);

    const bootData = await bootRes.json();
    assert.equal(bootData.user.id, studentUser.id);
    assert.equal(bootData.activeRelease.releaseId, 'pilot-v1-draft');
    assert.equal(bootData.projection.totalXp, 0);
    assert.equal(bootData.projection.totalStars, 0);
    assert.equal(bootData.streak.currentStreak, 0);
  });

  await t.test('3. Download Content Release Bundle & ETag 304 Validation', async () => {
    // First download
    const bundleReq = new NextRequest('http://localhost:3000/api/v1/content/releases/pilot-v1-draft/bundle');
    const bundleRes = await bundleRoute(bundleReq, { params: Promise.resolve({ releaseId: 'pilot-v1-draft' }) });
    assert.equal(bundleRes.status, 200);

    const etag = bundleRes.headers.get('etag');
    assert.ok(etag, 'ETag must be returned');

    const bundleData = await bundleRes.json();
    assert.ok(bundleData.chapters['chapter-01']);
    assert.ok(bundleData.chapters['chapter-02']);

    // Re-request with If-None-Match -> 304 Not Modified
    const req304 = new NextRequest('http://localhost:3000/api/v1/content/releases/pilot-v1-draft/bundle', {
      headers: { 'if-none-match': etag },
    });
    const res304 = await bundleRoute(req304, { params: Promise.resolve({ releaseId: 'pilot-v1-draft' }) });
    assert.equal(res304.status, 304);
  });

  await t.test('4. Initial Chapter Catalog (Chapter 1 Unlocked, Chapter 2 Locked)', async () => {
    const chReq = makeAuthReq('http://localhost:3000/api/v1/content/chapters');
    const chRes = await chaptersRoute(chReq);
    assert.equal(chRes.status, 200);

    const data = await chRes.json();
    const ch1 = data.chapters.find((c) => c.chapterId === 'chapter-01');
    const ch2 = data.chapters.find((c) => c.chapterId === 'chapter-02');

    assert.equal(ch1.isUnlocked, true, 'Chapter 1 must be unlocked initially');
    assert.equal(ch2.isUnlocked, false, 'Chapter 2 must be locked initially');
  });

  await t.test('5. Complete Chapter 1 Journey via Sync Batch', async () => {
    const attemptId = crypto.randomUUID();

    const actions = [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
      // Microlearning completion (Must be BEFORE making a choice on the scene)
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 2,
        actionType: 'COMPLETE_MICROLEARNING',
        sceneNodeId: 'CH1-SC-01',
      },
      // 7 Story Choices
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 3,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-01',
        choiceId: 'ch1-c1-esteh', // -2500, saldo 7500
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 4,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-02',
        choiceId: 'ch1-c2-bayarfotokopi', // -2000, saldo 5500
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 5,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-03',
        choiceId: 'ch1-c3-tolakdiskon', // 0, saldo 5500
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 6,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-04',
        choiceId: 'ch1-c4-kertasbekas', // 0, saldo 5500
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 7,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-05',
        choiceId: 'ch1-c5-pinjampensil', // 0, saldo 5500
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 8,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-06',
        choiceId: 'ch1-c6-maincatur', // 0, saldo 5500
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 9,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-07',
        choiceId: 'ch1-c7-menuju-pass', // 0, saldo 2000
      },
      // Mini-game Sortir Cepat
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 10,
        actionType: 'SUBMIT_MINIGAME',
        sceneNodeId: 'MG-SORTIR-CEPAT',
        payload: {
          answers: {
            'item-01': 'Kebutuhan',
            'item-02': 'Keinginan',
            'item-03': 'Kebutuhan',
            'item-04': 'Keinginan',
            'item-05': 'Tabungan',
            'item-06': 'Kebutuhan',
            'item-07': 'Keinginan',
            'item-08': 'Kebutuhan',
            'item-09': 'Keinginan',
            'item-10': 'Tabungan',
          },
        },
      },
      // Boss Challenge Chapter 1
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 11,
        actionType: 'SUBMIT_BOSS',
        sceneNodeId: 'BOSS-CH1-SURVIVAL',
        payload: {
          artifactData: {
            total_money: 10000,
            reserve_target: 2000,
            core_needs: ['Fotokopi', 'Angkot'],
            wants_delayed: ['Boba', 'Skin Game'],
            spending_limit: 1500,
            unforeseen_action: 'Gunakan cadangan',
          },
          transferOptionId: 'tq1-opt2',
        },
      },
    ];

    const syncReq = makeAuthReq('http://localhost:3000/api/v1/sync', 'POST', {
      batchId: crypto.randomUUID(),
      actions,
    });

    const syncRes = await syncRoute(syncReq);
    assert.equal(syncRes.status, 200);

    const syncData = await syncRes.json();
    assert.equal(syncData.results.length, 11);
    if (!syncData.results.every((r) => r.status === 'accepted')) {
      console.log('Results not accepted:', syncData.results.filter((r) => r.status !== 'accepted'));
    }
    assert.ok(syncData.results.every((r) => r.status === 'accepted'));


    // Assert chapter completion and Survivor identity
    assert.ok(syncData.canonicalSnapshot.completedChapters.includes('chapter-01'));
    assert.equal(syncData.canonicalSnapshot.identity, 'Survivor');
    assert.ok(syncData.canonicalSnapshot.totalXp >= 100);
    assert.ok(syncData.canonicalSnapshot.totalCoins >= 45);
    assert.equal(syncData.canonicalSnapshot.totalStars, 1);
  });

  await t.test('6. Chapter 2 is Now Unlocked in Catalog', async () => {
    const chReq = makeAuthReq('http://localhost:3000/api/v1/content/chapters');
    const chRes = await chaptersRoute(chReq);
    assert.equal(chRes.status, 200);

    const data = await chRes.json();
    const ch2 = data.chapters.find((c) => c.chapterId === 'chapter-02');
    assert.equal(ch2.isUnlocked, true, 'Chapter 2 must now be unlocked!');
  });

  await t.test('7. Complete Chapter 2 Journey via Sync Batch', async () => {
    const attemptId = crypto.randomUUID();

    const actions = [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-02' },
      },
      // Mini-game Dana Darurat
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 2,
        actionType: 'SUBMIT_MINIGAME',
        sceneNodeId: 'MG-DANA-DARURAT',
        payload: {
          decisions: {
            'shock-01': 'mit-01-a',
            'shock-02': 'mit-02-a',
            'shock-03': 'mit-03-a',
          },
        },
      },
      // Boss Challenge Chapter 2
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 3,
        actionType: 'SUBMIT_BOSS',
        sceneNodeId: 'BOSS-CH2-SHIELD',
        payload: {
          artifactData: {
            savings_goal: 250000,
            emergency_target: 50000,
            monthly_allocation_rule: 'Sisihkan minimal 20% ke dana darurat dan 70% ke tabungan impian di awal penerimaan',
            cash_buffer: '<= 15000',
            emergency_criteria: 'Hanya untuk kondisi mendesak, penting, dan tak terduga (kesehatan, keselamatan, studi wajib)',
            replenishment_rule: 'Prioritaskan pemulihan dana darurat pada alokasi bulan berikutnya sebelum memperbesar belanja lain',
          },
          transferOptionId: 'tq2-opt1',
        },
      },
    ];

    const syncReq = makeAuthReq('http://localhost:3000/api/v1/sync', 'POST', {
      batchId: crypto.randomUUID(),
      actions,
    });

    const syncRes = await syncRoute(syncReq);
    assert.equal(syncRes.status, 200);

    const syncData = await syncRes.json();
    assert.ok(syncData.canonicalSnapshot.completedChapters.includes('chapter-02'));
    assert.equal(syncData.canonicalSnapshot.identity, 'Financial Shield Planner');
    assert.equal(syncData.canonicalSnapshot.totalStars, 2);
  });

  await t.test('8. Cohort Leaderboard Displays Pseudonymous Player with Total Stats', async () => {
    const leadReq = makeAuthReq(`http://localhost:3000/api/v1/schools/cohorts/${referenceCohortId}/leaderboard`);
    const leadRes = await leaderboardRoute(leadReq, { params: Promise.resolve({ id: referenceCohortId }) });
    assert.equal(leadRes.status, 200);

    const leadData = await leadRes.json();
    assert.ok(Array.isArray(leadData.leaderboard));
    assert.ok(leadData.leaderboard.length > 0);

    const selfEntry = leadData.leaderboard.find((e) => e.playerCode === studentUser.playerCode);
    assert.ok(selfEntry, 'Student must be present in cohort leaderboard');
    assert.equal(selfEntry.totalStars, 2);
    assert.ok(selfEntry.totalXp > 150);
  });

  await t.test('9. First-Party Analytics Ingestion', async () => {
    const anaReq = makeAuthReq('http://localhost:3000/api/v1/analytics/events', 'POST', {
      events: [
        {
          eventName: 'chapter_complete',
          eventPayload: { chapterId: 'chapter-01', score: 100 },
        },
        {
          eventName: 'chapter_complete',
          eventPayload: { chapterId: 'chapter-02', score: 100 },
        },
      ],
    });

    const anaRes = await analyticsRoute(anaReq);
    assert.equal(anaRes.status, 200);
    const anaData = await anaRes.json();
    assert.equal(anaData.success, true);
    assert.equal(anaData.recordedCount, 2);
  });

  await t.test('10. Data Portability Export & Account Deletion', async () => {
    // Export own data
    const expReq = makeAuthReq('http://localhost:3000/api/v1/consent/export', 'POST', {
      passphrase: 'KataSandiKuat2026'
    });
    const expRes = await exportRoute(expReq);
    assert.equal(expRes.status, 200);

    const expData = await expRes.json();
    assert.equal(expData.exportData.user.id, studentUser.id);
    assert.equal(expData.exportData.projection.total_stars, 2);
    assert.ok(expData.exportData.rewards.length > 0);


    // Delete own account
    const delReq = makeAuthReq('http://localhost:3000/api/v1/consent/account', 'DELETE', {
      passphrase: 'KataSandiKuat2026'
    });
    const delRes = await deleteAccountRoute(delReq);
    assert.equal(delRes.status, 200);

    // Verify subsequent authenticated call fails (session revoked)
    const afterReq = makeAuthReq('http://localhost:3000/api/v1/bootstrap');
    const afterRes = await bootstrapRoute(afterReq);
    assert.equal(afterRes.status, 401, 'Revoked session must be rejected with 401');
  });

  await pool.end();
});
