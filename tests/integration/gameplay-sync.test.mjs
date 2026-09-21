import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import crypto from 'node:crypto';
import { processSyncBatch } from '../../src/lib/game/sync-handler.ts';
import { rebuildPlayerProjection } from '../../src/lib/game/projection-rebuilder.ts';
import { calculateStreak } from '../../src/lib/game/streak-engine.ts';
import {
  evaluateSortirCepat,
  evaluateDanaDarurat,
  evaluateBossChallenge,
} from '../../src/lib/game/narrative-engine.ts';
import { getChapter, getMiniGame, getBossChallenge } from '../../src/lib/game/content-loader.ts';

const { Pool } = pg;
const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:fairuz@127.0.0.1:5432/finspire_test';
const pool = new Pool({ connectionString: testDbUrl });

test('Fase 05: Game Engine, Idempotency, and Concurrency Integration Tests', async (t) => {
  // Helper to create test user in finspire_test
  const createTestUser = async () => {
    const playerCode = `FOX-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').slice(0, 3).toUpperCase()}`;
    const res = await pool.query(
      `INSERT INTO users (role, player_code, nickname, is_anonymous)
       VALUES ('student', $1, 'Siswa Test', false)
       RETURNING id, player_code;`,
      [playerCode]
    );
    const userId = res.rows[0].id;
    return { userId, playerCode };
  };

  await t.test('1. Pure Domain Mini-game & Boss Rubric Evaluation', () => {
    const ch1 = getChapter('chapter-01');
    const ch2 = getChapter('chapter-02');
    assert.ok(ch1, 'Chapter 1 exists');
    assert.ok(ch2, 'Chapter 2 exists');

    // MiniGame Ch1: Sortir Cepat
    const mg1 = getMiniGame('chapter-01');
    assert.ok(mg1, 'MiniGame Ch1 exists');

    // Perfect answers (10/10)
    const perfectAnswers = {};
    for (const item of mg1.items) {
      perfectAnswers[item.itemId] = item.category;
    }
    const res1 = evaluateSortirCepat(mg1, perfectAnswers);
    assert.equal(res1.passed, true);
    assert.equal(res1.scorePercent, 100);
    assert.equal(res1.correctCount, 10);

    // Failing answers (only 2 correct)
    const badAnswers = { 'item-01': 'Kebutuhan', 'item-02': 'Kebutuhan' };
    const resBad = evaluateSortirCepat(mg1, badAnswers);
    assert.equal(resBad.passed, false);
    assert.ok(resBad.scorePercent < 80);

    // MiniGame Ch2: Dana Darurat
    const mg2 = getMiniGame('chapter-02');
    assert.ok(mg2, 'MiniGame Ch2 exists');
    const perfectDecisions = {
      'shock-01': 'mit-01-a',
      'shock-02': 'mit-02-a',
      'shock-03': 'mit-03-a',
    };
    const res2 = evaluateDanaDarurat(mg2, perfectDecisions);
    assert.equal(res2.passed, true);
    assert.equal(res2.scorePercent, 100);

    // Boss Challenge Ch1
    const boss1 = getBossChallenge('chapter-01');
    assert.ok(boss1, 'Boss 1 exists');
    const bossEval = evaluateBossChallenge(ch1, boss1, {
      artifactData: {
        field1: 'Target Rp10.000',
        field2: 'Batas Belanja',
        field3: 'Protokol Darurat',
      },
      transferOptionId: 'tq1-opt2',
      accounts: { availableCash: 7500, goalSavings: 0, emergencyFund: 0, debt: 0 },
    });
    assert.equal(bossEval.passed, true);
    assert.ok(bossEval.scoreMastery >= 75);
  });

  await t.test('2. Streak Engine WIB Date Calculations', () => {
    // Case A: First activity
    const s1 = calculateStreak(0, 0, null, '2026-09-21');
    assert.equal(s1.currentStreak, 1);
    assert.equal(s1.longestStreak, 1);
    assert.equal(s1.isNewDay, true);

    // Case B: Same day activity (no advance)
    const s2 = calculateStreak(1, 1, '2026-09-21', '2026-09-21');
    assert.equal(s2.currentStreak, 1);
    assert.equal(s2.isNewDay, false);

    // Case C: Consecutive day (yesterday was 2026-09-21, today is 2026-09-22)
    const s3 = calculateStreak(1, 1, '2026-09-21', '2026-09-22');
    assert.equal(s3.currentStreak, 2);
    assert.equal(s3.longestStreak, 2);
    assert.equal(s3.isNewDay, true);

    // Case D: Gap of 2 days (reset to 1)
    const s4 = calculateStreak(5, 5, '2026-09-20', '2026-09-23');
    assert.equal(s4.currentStreak, 1);
    assert.equal(s4.longestStreak, 5); // longest streak preserved!
    assert.equal(s4.isNewDay, true);
  });

  await t.test('3. Sync Batch Sequential Execution & Reward Grants', async () => {
    const { userId } = await createTestUser();
    const attemptId = crypto.randomUUID();

    // Start Chapter 1 and submit choice for Scene 1
    const actions = [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 2,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-01',
        choiceId: 'ch1-c1-esteh', // costs 2500, awards XP 10, coin 5
        payload: { choiceId: 'ch1-c1-esteh' },
      },
    ];

    const batchRes = await processSyncBatch(userId, crypto.randomUUID(), undefined, actions);
    assert.equal(batchRes.results.length, 2);
    assert.equal(batchRes.results[0].status, 'accepted');
    assert.equal(batchRes.results[1].status, 'accepted');

    const sc1Result = batchRes.results[1];
    assert.equal(sc1Result.canonicalConsequence.newAccounts.availableCash, 7500);
    assert.equal(sc1Result.canonicalConsequence.nextNodeId, 'CH1-SC-02');
    assert.equal(batchRes.canonicalSnapshot.totalXp, 10);
    assert.equal(batchRes.canonicalSnapshot.totalCoins, 5);
    assert.equal(batchRes.canonicalSnapshot.currentStreak, 1);

    // Verify database row in reward_ledger
    const ledgerRows = await pool.query(
      `SELECT * FROM reward_ledger WHERE user_id = $1`,
      [userId]
    );
    assert.equal(ledgerRows.rows.length, 2); // 1 xp row, 1 coin row
  });

  await t.test('4. Idempotency Key Replay vs Key Reused Detection', async () => {
    const { userId } = await createTestUser();
    const attemptId = crypto.randomUUID();
    const startActionId = crypto.randomUUID();

    // Initial action
    await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: startActionId,
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
    ]);

    // Replay exact same actionId and payload -> IDEMPOTENT_RETRY (duplicate)
    const replayRes = await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: startActionId,
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
    ]);
    assert.equal(replayRes.results[0].status, 'duplicate');
    assert.equal(replayRes.results[0].code, 'IDEMPOTENT_RETRY');

    // Reuse same actionId with different payload/scene -> IDEMPOTENCY_KEY_REUSED (rejected)
    const badReuseRes = await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: startActionId, // REUSED ID!
        attemptId,
        clientSequence: 2,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-01',
        choiceId: 'ch1-c1-boba',
        payload: { choiceId: 'ch1-c1-boba' },
      },
    ]);
    assert.equal(badReuseRes.results[0].status, 'rejected');
    assert.equal(badReuseRes.results[0].code, 'IDEMPOTENCY_KEY_REUSED');
  });

  await t.test('5. First-Accepted Decision Wins: Conflicting Scene Choices Conflict', async () => {
    const { userId } = await createTestUser();
    const attemptId = crypto.randomUUID();

    // 1. Initialize attempt
    await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 2,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-01',
        choiceId: 'ch1-c1-airbekal', // Option A chosen first!
        payload: { choiceId: 'ch1-c1-airbekal' },
      },
    ]);

    // 2. Submit conflicting choice (Option B) for the same scene node
    const conflictRes = await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 3,
        actionType: 'CHOICE_SELECTED',
        sceneNodeId: 'CH1-SC-01',
        choiceId: 'ch1-c1-boba', // Option B submitted later!
        payload: { choiceId: 'ch1-c1-boba' },
      },
    ]);

    assert.equal(conflictRes.results[0].status, 'conflict');
    assert.equal(conflictRes.results[0].code, 'SCENE_ALREADY_DECIDED');
    assert.ok(conflictRes.results[0].message.includes('ch1-c1-airbekal'));
  });

  await t.test('6. Concurrency Stress Test: 10 Parallel Identical Sync Actions', async () => {
    const { userId } = await createTestUser();
    const attemptId = crypto.randomUUID();
    const actionId = crypto.randomUUID();

    // Pre-initialize attempt
    await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
    ]);

    // Send 10 concurrent requests with the identical action
    const concurrentPromises = Array.from({ length: 10 }).map(() =>
      processSyncBatch(userId, crypto.randomUUID(), undefined, [
        {
          actionId,
          attemptId,
          clientSequence: 2,
          actionType: 'CHOICE_SELECTED',
          sceneNodeId: 'CH1-SC-01',
          choiceId: 'ch1-c1-esteh',
          payload: { choiceId: 'ch1-c1-esteh' },
        },
      ])
    );

    const responses = await Promise.all(concurrentPromises);

    // Count how many got accepted vs duplicate
    let acceptedCount = 0;
    let duplicateCount = 0;

    for (const res of responses) {
      if (res.results[0].status === 'accepted') acceptedCount++;
      if (res.results[0].status === 'duplicate') duplicateCount++;
    }

    assert.equal(acceptedCount, 1, 'Exactly 1 concurrent request must be accepted');
    assert.equal(duplicateCount, 9, 'Remaining 9 concurrent requests must return duplicate');

    // Assert that reward_ledger has exactly 1 row for this scene's XP and 1 row for coin
    const ledgerXp = await pool.query(
      `SELECT count(*) FROM reward_ledger WHERE user_id = $1 AND source_node_id = 'CH1-SC-01' AND reward_type = 'xp'`,
      [userId]
    );
    assert.equal(Number(ledgerXp.rows[0].count), 1, 'Exactly 1 XP ledger entry recorded');
  });

  await t.test('7. Complete Mini-Game, Boss Challenge, and Projection Rebuild', async () => {
    const { userId } = await createTestUser();
    const attemptId = crypto.randomUUID();

    // 1. Start Chapter 1
    await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 1,
        actionType: 'START_PLAYTHROUGH',
        payload: { chapterId: 'chapter-01' },
      },
    ]);

    // 2. Submit Mini-Game Pass
    const mgRes = await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 2,
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
    ]);
    assert.equal(mgRes.results[0].status, 'accepted');
    assert.equal(mgRes.canonicalSnapshot.totalXp, 25);
    assert.equal(mgRes.canonicalSnapshot.totalCoins, 10);

    // 3. Submit Boss Challenge Pass
    const bossRes = await processSyncBatch(userId, crypto.randomUUID(), undefined, [
      {
        actionId: crypto.randomUUID(),
        attemptId,
        clientSequence: 3,
        actionType: 'SUBMIT_BOSS',
        sceneNodeId: 'BOSS-CH1-SURVIVAL',
        payload: {
          artifactData: {
            field1: 'Rp10.000',
            field2: 'Kebutuhan Prioritas',
            field3: 'Tanpa Saldo Minus',
          },
          transferOptionId: 'tq1-opt2',
        },
      },
    ]);
    assert.equal(bossRes.results[0].status, 'accepted');
    assert.equal(bossRes.canonicalSnapshot.totalStars, 1);
    assert.ok(bossRes.canonicalSnapshot.completedChapters.includes('chapter-01'));
    assert.equal(bossRes.canonicalSnapshot.identity, 'Survivor');

    // 4. Rebuild projection and verify 100% equivalence
    const rebuilt = await rebuildPlayerProjection(userId);
    assert.equal(rebuilt.totalXp, bossRes.canonicalSnapshot.totalXp);
    assert.equal(rebuilt.totalStars, bossRes.canonicalSnapshot.totalStars);
    assert.equal(rebuilt.totalCoins, bossRes.canonicalSnapshot.totalCoins);
    assert.deepEqual(rebuilt.completedChapters, bossRes.canonicalSnapshot.completedChapters);
  });

  await pool.end();
});

