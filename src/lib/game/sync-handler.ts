import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { playthroughAttempts, gameplayActions, rewardLedger } from '@/db/schema/gameplay';
import { playerStreaks } from '@/db/schema/projections';
import { getSystemClock } from '@/lib/clock';
import { getChapter, getMiniGame, getBossChallenge } from './content-loader';
import {
  computeInitialAccounts,
  evaluateChoiceTransition,
  evaluateSortirCepat,
  evaluateDanaDarurat,
  evaluateBossChallenge,
} from './narrative-engine';
import { calculateStreak } from './streak-engine';
import { rebuildPlayerProjection } from './projection-rebuilder';
import type {
  SyncActionInput,
  ActionProcessingResult,
  CanonicalSnapshot,
  AccountState,
  SyncBatchResponse,
  RewardGrant,
} from './types';

export async function processSyncBatch(
  userId: string,
  batchId: string,
  installationId: string | undefined,
  actions: SyncActionInput[]
): Promise<SyncBatchResponse> {
  const clock = getSystemClock();
  const todayWib = clock.todayWib();
  const serverTime = clock.now().toISOString();

  // Process all actions within an atomic PostgreSQL transaction
  return await db.transaction(async (tx) => {
    const results: ActionProcessingResult[] = [];
    let lastAttemptId: string | null = null;
    let lastChapterId: string | null = null;
    let lastNodeId: string | null = null;
    let currentAccounts: AccountState | null = null;

    // Sort actions by clientSequence ascending
    const sortedActions = [...actions].sort((a, b) => a.clientSequence - b.clientSequence);

    for (const action of sortedActions) {
      const {
        actionId,
        attemptId: inputAttemptId,
        clientSequence,
        actionType,
        sceneNodeId,
        choiceId,
        payload = {},
      } = action;

      // 1. Idempotency check: Action ID uniqueness
      const existingAction = await tx
        .select()
        .from(gameplayActions)
        .where(eq(gameplayActions.actionId, actionId));

      if (existingAction.length > 0) {
        const recorded = existingAction[0];
        // Check if payload or target node matches
        const isPayloadMatch =
          recorded.sceneNodeId === (sceneNodeId ?? 'START') &&
          recorded.choiceId === (choiceId ?? 'START');

        if (isPayloadMatch) {
          results.push({
            actionId,
            status: 'duplicate',
            code: 'IDEMPOTENT_RETRY',
            message: 'Aksi telah diproses sebelumnya (idempotent replay).',
            retryable: false,
          });
          continue;
        } else {
          // Action ID reused with different payload!
          results.push({
            actionId,
            status: 'rejected',
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Action ID sama digunakan dengan payload berbeda.',
            retryable: false,
          });
          continue;
        }
      }

      // 2. Process action based on type
      if (actionType === 'START_PLAYTHROUGH') {
        const chapterId = (payload.chapterId as string) || 'chapter-01';
        const chapter = getChapter(chapterId);
        if (!chapter) {
          results.push({
            actionId,
            status: 'rejected',
            code: 'CHAPTER_NOT_FOUND',
            message: `Bab '${chapterId}' tidak ditemukan dalam rilis aktif.`,
            retryable: false,
          });
          continue;
        }

        let targetAttemptId = inputAttemptId;
        if (!targetAttemptId) {
          const insertedAttempt = await tx
            .insert(playthroughAttempts)
            .values({
              userId,
              releaseId: 'pilot-v1-draft',
              chapterId,
              attemptNumber: 1,
              status: 'in_progress',
            })
            .returning({ id: playthroughAttempts.id });
          targetAttemptId = insertedAttempt[0].id;
        } else {
          // Insert with specified UUID if provided
          await tx
            .insert(playthroughAttempts)
            .values({
              id: targetAttemptId,
              userId,
              releaseId: 'pilot-v1-draft',
              chapterId,
              attemptNumber: 1,
              status: 'in_progress',
            })
            .onConflictDoNothing();
        }

        // Record start action in gameplay_actions
        await tx.insert(gameplayActions).values({
          attemptId: targetAttemptId,
          actionId,
          clientSequence,
          sceneNodeId: 'START',
          choiceId: 'START',
          actionPayload: payload,
          occurredAt: action.clientOccurredAt ? new Date(action.clientOccurredAt) : clock.now(),
        });

        lastAttemptId = targetAttemptId;
        lastChapterId = chapterId;
        lastNodeId = chapter.entrypointNodeId;
        currentAccounts = computeInitialAccounts(chapter);

        results.push({
          actionId,
          status: 'accepted',
          code: 'OK',
          message: `Attempt bab '${chapterId}' berhasil dimulai.`,
          retryable: false,
          canonicalConsequence: {
            sceneNodeId: 'START',
            choiceId: 'START',
            deltaSimulatedMoney: 0,
            newAccounts: currentAccounts,
            rewardsAwarded: [],
            nextNodeId: chapter.entrypointNodeId,
            foxyReaction: 'FX-IDLE',
          },
        });
        continue;
      }

      // All remaining actions require an attemptId
      const attemptId = inputAttemptId || lastAttemptId;
      if (!attemptId) {
        results.push({
          actionId,
          status: 'rejected',
          code: 'MISSING_ATTEMPT_ID',
          message: 'Aksi gameplay memerlukan attemptId yang valid.',
          retryable: false,
        });
        continue;
      }

      // Verify attempt exists and belongs to this user
      const attemptRows = await tx
        .select()
        .from(playthroughAttempts)
        .where(
          and(
            eq(playthroughAttempts.id, attemptId),
            eq(playthroughAttempts.userId, userId)
          )
        );

      if (attemptRows.length === 0) {
        results.push({
          actionId,
          status: 'rejected',
          code: 'ATTEMPT_NOT_FOUND',
          message: 'Attempt tidak ditemukan atau bukan milik pengguna terotentikasi.',
          retryable: false,
        });
        continue;
      }

      const attempt = attemptRows[0];
      const chapter = getChapter(attempt.chapterId);
      if (!chapter) {
        results.push({
          actionId,
          status: 'rejected',
          code: 'CHAPTER_NOT_FOUND',
          message: 'Bab dari attempt tidak valid.',
          retryable: false,
        });
        continue;
      }

      lastAttemptId = attempt.id;
      lastChapterId = attempt.chapterId;
      if (!currentAccounts) {
        currentAccounts = computeInitialAccounts(chapter);
      }

      const targetSceneNodeId = sceneNodeId ?? 'UNKNOWN';
      const targetChoiceId = choiceId ?? 'UNKNOWN';

      // 3. Check decision slot uniqueness on (attempt_id, scene_node_id)
      const slotOccupied = await tx
        .select()
        .from(gameplayActions)
        .where(
          and(
            eq(gameplayActions.attemptId, attempt.id),
            eq(gameplayActions.sceneNodeId, targetSceneNodeId)
          )
        );

      if (slotOccupied.length > 0) {
        const existingChoice = slotOccupied[0].choiceId;
        if (existingChoice === targetChoiceId) {
          results.push({
            actionId,
            status: 'duplicate',
            code: 'DECISION_ALREADY_RECORDED',
            message: 'Keputusan untuk scene ini sudah tercatat sebelumnya.',
            retryable: false,
          });
        } else {
          // Conflict: Different choice submitted for the same scene node!
          results.push({
            actionId,
            status: 'conflict',
            code: 'SCENE_ALREADY_DECIDED',
            message: `Konflik: scene '${targetSceneNodeId}' sudah diselesaikan dengan pilihan '${existingChoice}'.`,
            retryable: false,
          });
        }
        continue;
      }

      // 4. Handle CHOICE_SELECTED
      if (actionType === 'CHOICE_SELECTED') {
        try {
          const evalRes = evaluateChoiceTransition(
            chapter,
            currentAccounts,
            targetSceneNodeId,
            targetChoiceId
          );

          // Insert into gameplay_actions
          await tx.insert(gameplayActions).values({
            attemptId: attempt.id,
            actionId,
            clientSequence,
            sceneNodeId: targetSceneNodeId,
            choiceId: targetChoiceId,
            actionPayload: payload,
            occurredAt: action.clientOccurredAt ? new Date(action.clientOccurredAt) : clock.now(),
          });

          // Insert reward grants into reward_ledger (deduplicated by constraint)
          for (const reward of evalRes.rewards) {
            await tx
              .insert(rewardLedger)
              .values({
                userId,
                releaseId: 'pilot-v1-draft',
                sourceNodeId: reward.sourceNodeId,
                attemptId: attempt.id,
                rewardType: reward.type,
                amount: reward.amount,
                reason: `Reward adegan ${targetSceneNodeId}`,
              })
              .onConflictDoNothing();
          }

          currentAccounts = evalRes.newAccounts;
          lastNodeId = evalRes.nextNodeId;

          // Check if terminal node reached
          if (evalRes.nextNodeId.includes('PASS')) {
            await tx
              .update(playthroughAttempts)
              .set({
                status: 'completed',
                completedAt: clock.now(),
              })
              .where(eq(playthroughAttempts.id, attempt.id));
          }

          results.push({
            actionId,
            status: 'accepted',
            code: 'OK',
            message: 'Pilihan cerita berhasil dievaluasi dan dicatat.',
            retryable: false,
            canonicalConsequence: {
              sceneNodeId: targetSceneNodeId,
              choiceId: targetChoiceId,
              deltaSimulatedMoney: evalRes.deltaSimulatedMoney,
              newAccounts: evalRes.newAccounts,
              rewardsAwarded: evalRes.rewards,
              nextNodeId: evalRes.nextNodeId,
              foxyReaction: evalRes.foxyReaction,
            },
          });
        } catch (err: unknown) {
          const e = err as { code?: string; message?: string };
          results.push({
            actionId,
            status: 'rejected',
            code: e?.code || 'VALIDATION_ERROR',
            message: e?.message || 'Gagal mengevaluasi pilihan cerita.',
            retryable: false,
          });
        }
        continue;
      }

      // 5. Handle COMPLETE_MICROLEARNING
      if (actionType === 'COMPLETE_MICROLEARNING') {
        await tx.insert(gameplayActions).values({
          attemptId: attempt.id,
          actionId,
          clientSequence,
          sceneNodeId: targetSceneNodeId,
          choiceId: 'ACKNOWLEDGED',
          actionPayload: payload,
          occurredAt: action.clientOccurredAt ? new Date(action.clientOccurredAt) : clock.now(),
        });

        // Award 5 XP once per node
        await tx
          .insert(rewardLedger)
          .values({
            userId,
            releaseId: 'pilot-v1-draft',
            sourceNodeId: targetSceneNodeId,
            attemptId: attempt.id,
            rewardType: 'xp',
            amount: 5,
            reason: `Microlearning card ${targetSceneNodeId}`,
          })
          .onConflictDoNothing();

        results.push({
          actionId,
          status: 'accepted',
          code: 'OK',
          message: 'Microlearning berhasil diselesaikan.',
          retryable: false,
          canonicalConsequence: {
            sceneNodeId: targetSceneNodeId,
            choiceId: 'ACKNOWLEDGED',
            deltaSimulatedMoney: 0,
            newAccounts: currentAccounts,
            rewardsAwarded: [{ type: 'xp', amount: 5, sourceNodeId: targetSceneNodeId }],
            nextNodeId: targetSceneNodeId,
            foxyReaction: 'FX-HAPPY',
          },
        });
        continue;
      }

      // 6. Handle SUBMIT_MINIGAME
      if (actionType === 'SUBMIT_MINIGAME') {
        const miniGame = getMiniGame(attempt.chapterId);
        if (!miniGame) {
          results.push({
            actionId,
            status: 'rejected',
            code: 'MINIGAME_NOT_FOUND',
            message: 'Mini game tidak ditemukan untuk bab ini.',
            retryable: false,
          });
          continue;
        }

        let passed = false;
        let scorePercent = 0;

        if (miniGame.gameType === 'categorization') {
          const rawAnswers = (payload.answers as Record<string, string>) || {};
          const res = evaluateSortirCepat(miniGame, rawAnswers);
          passed = res.passed;
          scorePercent = res.scorePercent;
        } else {
          const rawDecisions = (payload.decisions as Record<string, string>) || {};
          const res = evaluateDanaDarurat(miniGame, rawDecisions);
          passed = res.passed;
          scorePercent = res.scorePercent;
        }

        await tx.insert(gameplayActions).values({
          attemptId: attempt.id,
          actionId,
          clientSequence,
          sceneNodeId: targetSceneNodeId,
          choiceId: passed ? 'PASS' : 'RETRY',
          actionPayload: { ...payload, passed, scorePercent },
          occurredAt: action.clientOccurredAt ? new Date(action.clientOccurredAt) : clock.now(),
        });

        const rewards: RewardGrant[] = [];
        if (passed) {
          // Award REWARD-MINIGAME-PASS (25 XP, 10 Coins)
          await tx
            .insert(rewardLedger)
            .values({
              userId,
              releaseId: 'pilot-v1-draft',
              sourceNodeId: miniGame.gameId,
              attemptId: attempt.id,
              rewardType: 'xp',
              amount: 25,
              reason: `Mini-game pass ${miniGame.gameId}`,
            })
            .onConflictDoNothing();

          await tx
            .insert(rewardLedger)
            .values({
              userId,
              releaseId: 'pilot-v1-draft',
              sourceNodeId: miniGame.gameId,
              attemptId: attempt.id,
              rewardType: 'coin',
              amount: 10,
              reason: `Mini-game pass ${miniGame.gameId}`,
            })
            .onConflictDoNothing();

          rewards.push(
            { type: 'xp', amount: 25, sourceNodeId: miniGame.gameId },
            { type: 'coin', amount: 10, sourceNodeId: miniGame.gameId }
          );
        }

        results.push({
          actionId,
          status: 'accepted',
          code: 'OK',
          message: passed ? 'Mini game lulus!' : 'Skor mini game belum memenuhi batas minimal.',
          retryable: !passed,
          canonicalConsequence: {
            sceneNodeId: targetSceneNodeId,
            choiceId: passed ? 'PASS' : 'RETRY',
            deltaSimulatedMoney: 0,
            newAccounts: currentAccounts,
            rewardsAwarded: rewards,
            nextNodeId: targetSceneNodeId,
            foxyReaction: passed ? 'FX-CELEBRATE' : 'FX-WORRIED',
          },
        });
        continue;
      }

      // 7. Handle SUBMIT_BOSS
      if (actionType === 'SUBMIT_BOSS') {
        const boss = getBossChallenge(attempt.chapterId);
        if (!boss) {
          results.push({
            actionId,
            status: 'rejected',
            code: 'BOSS_NOT_FOUND',
            message: 'Boss challenge tidak ditemukan untuk bab ini.',
            retryable: false,
          });
          continue;
        }

        const bossEval = evaluateBossChallenge(chapter, boss, {
          artifactData: payload.artifactData as Record<string, unknown>,
          transferOptionId: payload.transferOptionId as string,
          accounts: currentAccounts,
        });

        await tx.insert(gameplayActions).values({
          attemptId: attempt.id,
          actionId,
          clientSequence,
          sceneNodeId: targetSceneNodeId,
          choiceId: bossEval.passed ? 'BOSS_PASS' : 'BOSS_FAIL',
          actionPayload: { ...payload, bossEval },
          occurredAt: action.clientOccurredAt ? new Date(action.clientOccurredAt) : clock.now(),
        });

        const rewards: RewardGrant[] = [];
        if (bossEval.passed) {
          // Update attempt to completed
          await tx
            .update(playthroughAttempts)
            .set({
              status: 'completed',
              scoreMastery: bossEval.scoreMastery,
              completedAt: clock.now(),
            })
            .where(eq(playthroughAttempts.id, attempt.id));

          // Award Boss Reward (50 XP, 30 Coins, Star)
          const bossRewardKey = boss.rewardPolicyKey;
          const badgeId = chapter.badge.badgeId;

          await tx
            .insert(rewardLedger)
            .values({
              userId,
              releaseId: 'pilot-v1-draft',
              sourceNodeId: boss.bossId,
              attemptId: attempt.id,
              rewardType: 'xp',
              amount: 50,
              reason: `Boss mastery ${bossRewardKey}`,
            })
            .onConflictDoNothing();

          await tx
            .insert(rewardLedger)
            .values({
              userId,
              releaseId: 'pilot-v1-draft',
              sourceNodeId: boss.bossId,
              attemptId: attempt.id,
              rewardType: 'coin',
              amount: 30,
              reason: `Boss mastery ${bossRewardKey}`,
            })
            .onConflictDoNothing();

          await tx
            .insert(rewardLedger)
            .values({
              userId,
              releaseId: 'pilot-v1-draft',
              sourceNodeId: boss.bossId,
              attemptId: attempt.id,
              rewardType: 'star',
              amount: 1,
              reason: `Mastery badge ${badgeId}`,
            })
            .onConflictDoNothing();

          rewards.push(
            { type: 'xp', amount: 50, sourceNodeId: boss.bossId },
            { type: 'coin', amount: 30, sourceNodeId: boss.bossId },
            { type: 'star', amount: 1, sourceNodeId: boss.bossId, badgeId }
          );
        } else {
          // Failure update
          await tx
            .update(playthroughAttempts)
            .set({
              scoreMastery: bossEval.scoreMastery,
            })
            .where(eq(playthroughAttempts.id, attempt.id));
        }

        results.push({
          actionId,
          status: 'accepted',
          code: 'OK',
          message: bossEval.passed
            ? `Selamat! Tantangan Boss ${chapter.title} tuntas.`
            : 'Tantangan Boss belum mencapai kriteria kelulusan.',
          retryable: !bossEval.passed,
          canonicalConsequence: {
            sceneNodeId: targetSceneNodeId,
            choiceId: bossEval.passed ? 'BOSS_PASS' : 'BOSS_FAIL',
            deltaSimulatedMoney: 0,
            newAccounts: currentAccounts,
            rewardsAwarded: rewards,
            nextNodeId: bossEval.passed
              ? (chapter.chapterIndex === 1 ? 'CH1-PASS-SURVIVOR' : 'CH2-PASS-PLANNER')
              : targetSceneNodeId,
            foxyReaction: bossEval.passed ? 'FX-CELEBRATE' : 'FX-WORRIED',
          },
        });
        continue;
      }

      // Unhandled action type
      results.push({
        actionId,
        status: 'rejected',
        code: 'UNKNOWN_ACTION_TYPE',
        message: `Action type '${actionType}' tidak didukung.`,
        retryable: false,
      });
    }

    // 8. Streak calculation
    const streakRows = await tx
      .select()
      .from(playerStreaks)
      .where(eq(playerStreaks.userId, userId));

    const currentStreakVal = streakRows[0]?.currentStreak ?? 0;
    const longestStreakVal = streakRows[0]?.longestStreak ?? 0;
    const lastActivityDate = streakRows[0]?.lastActivityDate ?? null;

    const streakCalc = calculateStreak(
      currentStreakVal,
      longestStreakVal,
      lastActivityDate,
      todayWib
    );

    await tx
      .insert(playerStreaks)
      .values({
        userId,
        currentStreak: streakCalc.currentStreak,
        longestStreak: streakCalc.longestStreak,
        lastActivityDate: streakCalc.lastActivityDate,
        updatedAt: clock.now(),
      })
      .onConflictDoUpdate({
        target: playerStreaks.userId,
        set: {
          currentStreak: streakCalc.currentStreak,
          longestStreak: streakCalc.longestStreak,
          lastActivityDate: streakCalc.lastActivityDate,
          updatedAt: clock.now(),
        },
      });

    // 9. Rebuild projection
    const projection = await rebuildPlayerProjection(tx, userId);

    const canonicalSnapshot: CanonicalSnapshot = {
      attemptId: lastAttemptId,
      chapterId: lastChapterId,
      currentNodeId: lastNodeId,
      accounts: currentAccounts,
      totalXp: projection.totalXp,
      totalStars: projection.totalStars,
      totalCoins: projection.totalCoins,
      currentStreak: streakCalc.currentStreak,
      longestStreak: streakCalc.longestStreak,
      completedChapters: projection.completedChapters,
      identity: projection.completedChapters.includes('chapter-02')
        ? 'Financial Shield Planner'
        : projection.completedChapters.includes('chapter-01')
        ? 'Survivor'
        : 'Novice',
    };

    return {
      batchId,
      results,
      nextServerCursor: String(Date.now()),
      canonicalSnapshot,
      contentNotice: {
        latestActiveReleaseId: 'pilot-v1-draft',
        requiresUpdate: false,
      },
      serverTime,
    };
  });
}
