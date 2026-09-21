import type {
  AccountState,
  Chapter,
  RewardGrant,
  MiniGame,
  BossChallenge,
} from './types';
import { getRewardPolicy } from './content-loader';

export class DomainValidationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainValidationError';
    this.code = code;
  }
}

export function computeInitialAccounts(chapter: Chapter): AccountState {
  return {
    availableCash: chapter.initialAccounts.availableCash,
    goalSavings: chapter.initialAccounts.goalSavings,
    emergencyFund: chapter.initialAccounts.emergencyFund,
    debt: chapter.initialAccounts.debt,
    acquiredAssets: [...(chapter.initialAccounts.acquiredAssets ?? [])],
  };
}

export function evaluateChoiceTransition(
  chapter: Chapter,
  currentAccounts: AccountState,
  sceneNodeId: string,
  choiceId: string
): {
  newAccounts: AccountState;
  deltaSimulatedMoney: number;
  rewards: RewardGrant[];
  nextNodeId: string;
  foxyReaction: string;
  consequenceText: string;
} {
  const scene = chapter.scenes.find((s) => s.nodeId === sceneNodeId);
  if (!scene) {
    throw new DomainValidationError('NODE_NOT_FOUND', `Scene node '${sceneNodeId}' tidak ditemukan pada bab '${chapter.chapterId}'.`);
  }

  if (scene.isTerminal) {
    throw new DomainValidationError('TERMINAL_NODE', `Scene '${sceneNodeId}' adalah simpul terminal; tidak dapat memilih aksi lanjutan.`);
  }

  const choice = scene.choices?.find((c) => c.choiceId === choiceId);
  if (!choice) {
    throw new DomainValidationError('CHOICE_NOT_FOUND', `Pilihan '${choiceId}' tidak valid untuk scene '${sceneNodeId}'.`);
  }

  // Check required conditions
  if (choice.requiredConditions?.minCash !== undefined) {
    if (currentAccounts.availableCash < choice.requiredConditions.minCash) {
      throw new DomainValidationError(
        'INSUFFICIENT_CASH',
        `Saldo kas tidak mencukupi (tersedia: Rp${currentAccounts.availableCash}, dibutuhkan: Rp${choice.requiredConditions.minCash}).`
      );
    }
  }

  const newAccounts: AccountState = {
    availableCash: currentAccounts.availableCash,
    goalSavings: currentAccounts.goalSavings,
    emergencyFund: currentAccounts.emergencyFund,
    debt: currentAccounts.debt,
    acquiredAssets: [...(currentAccounts.acquiredAssets ?? [])],
  };

  let delta = choice.deltaSimulatedMoney ?? 0;

  // Process stateOperations if defined
  if (choice.stateOperations) {
    if (choice.stateOperations.transfers) {
      for (const t of choice.stateOperations.transfers) {
        if (!t.source || !t.target || !t.amount) continue;
        const amount = t.amount;
        
        // Ensure source has enough funds (only applicable if source is a numeric value and not debt)
        const sourceVal = newAccounts[t.source];
        if (typeof sourceVal === 'number' && t.source !== 'debt' && sourceVal < amount) {
          throw new DomainValidationError('INSUFFICIENT_FUNDS', `Saldo ${t.source} tidak cukup untuk dialokasikan.`);
        }

        // Apply transfer
        if (typeof newAccounts[t.source] === 'number') {
          (newAccounts as unknown as Record<string, number>)[t.source] -= amount;
        }
        if (typeof newAccounts[t.target] === 'number') {
          (newAccounts as unknown as Record<string, number>)[t.target] += amount;
        }
      }
    }

    if (choice.stateOperations.outflow !== undefined) {
      delta = -choice.stateOperations.outflow;
      newAccounts.availableCash += delta;
    } else if (choice.stateOperations.expense !== undefined) {
      delta = -choice.stateOperations.expense;
      newAccounts.availableCash += delta;
    } else if (choice.stateOperations.inflow !== undefined) {
      delta = choice.stateOperations.inflow;
      newAccounts.availableCash += delta;
    }

    if (choice.stateOperations.debtIncurred !== undefined) {
      newAccounts.debt += choice.stateOperations.debtIncurred;
      newAccounts.availableCash += choice.stateOperations.debtIncurred;
    }
    
    if (choice.stateOperations.debtRepaid !== undefined) {
      if (newAccounts.availableCash < choice.stateOperations.debtRepaid) {
        throw new DomainValidationError('INSUFFICIENT_FUNDS', 'Saldo kas tidak cukup untuk membayar utang.');
      }
      newAccounts.availableCash -= choice.stateOperations.debtRepaid;
      newAccounts.debt = Math.max(0, newAccounts.debt - choice.stateOperations.debtRepaid);
    }
  } else {
    // Fallback to legacy delta mapping if stateOperations not defined
    newAccounts.availableCash += delta;
  }

  // Check non-negative cash invariant unless this branch is an intentional failsoft
  if (newAccounts.availableCash < 0 && !choice.nextNodeId.includes('FAILSOFT')) {
    throw new DomainValidationError('NEGATIVE_BALANCE_VIOLATION', 'Keputusan ini menghasilkan saldo negatif yang dilarang.');
  }

  // Calculate rewards from reward policy
  const rewards: RewardGrant[] = [];
  if (choice.rewardPolicyKey) {
    const policy = getRewardPolicy(choice.rewardPolicyKey);
    if (policy) {
      if (policy.xp > 0) {
        rewards.push({
          type: 'xp',
          amount: policy.xp,
          sourceNodeId: sceneNodeId,
        });
      }
      if (policy.coin > 0) {
        rewards.push({
          type: 'coin',
          amount: policy.coin,
          sourceNodeId: sceneNodeId,
        });
      }
    }
  }

  return {
    newAccounts,
    deltaSimulatedMoney: delta,
    rewards,
    nextNodeId: choice.nextNodeId,
    foxyReaction: choice.foxyReactionState ?? 'FX-IDLE',
    consequenceText: choice.consequenceText,
  };
}

export function evaluateSortirCepat(
  miniGame: MiniGame,
  rawAnswers: Record<string, string>
): {
  passed: boolean;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
} {
  const items = miniGame.items ?? [];
  if (items.length === 0) {
    return { passed: true, scorePercent: 100, correctCount: 0, totalCount: 0 };
  }

  let correctCount = 0;
  for (const item of items) {
    const submittedCategory = rawAnswers[item.itemId]?.trim().toLowerCase();
    const expectedCategory = item.category.trim().toLowerCase();
    if (submittedCategory === expectedCategory) {
      correctCount++;
    }
  }

  const scorePercent = Math.round((correctCount / items.length) * 100);
  const passed = scorePercent >= miniGame.passThresholdPercent;

  return {
    passed,
    scorePercent,
    correctCount,
    totalCount: items.length,
  };
}

export function evaluateDanaDarurat(
  miniGame: MiniGame,
  rawDecisions: Record<string, string>
): {
  passed: boolean;
  scorePercent: number;
  correctCount: number;
  totalCount: number;
} {
  const scenarios = miniGame.simulationScenarios ?? [];
  if (scenarios.length === 0) {
    return { passed: true, scorePercent: 100, correctCount: 0, totalCount: 0 };
  }

  let correctCount = 0;
  for (const scenario of scenarios) {
    const recommended = scenario.mitigationOptions.find((o) => o.isRecommended);
    const submittedOptionId = rawDecisions[scenario.scenarioId];
    if (recommended && submittedOptionId === recommended.optionId) {
      correctCount++;
    }
  }

  const scorePercent = Math.round((correctCount / scenarios.length) * 100);
  const passed = scorePercent >= miniGame.passThresholdPercent;

  return {
    passed,
    scorePercent,
    correctCount,
    totalCount: scenarios.length,
  };
}

export function evaluateBossChallenge(
  chapter: Chapter,
  boss: BossChallenge,
  rawSubmission: {
    artifactData?: Record<string, unknown>;
    transferOptionId?: string;
    accounts?: AccountState;
  }
): {
  passed: boolean;
  scoreMastery: number;
  rubricBreakdown: Array<{
    dimension: string;
    score: number;
    maxWeight: number;
    passed: boolean;
  }>;
  masteryArtifactId: string;
} {
  const rubricBreakdown: Array<{
    dimension: string;
    score: number;
    maxWeight: number;
    passed: boolean;
  }> = [];

  let totalScore = 0;
  const accounts = rawSubmission.accounts ?? chapter.initialAccounts;

  for (const rubric of boss.evaluationRubric) {
    let dimPassed = false;

    if (
      rubric.evalMode === 'BALANCE_INTEGRITY' ||
      rubric.dimension.includes('Integritas Saldo') ||
      rubric.dimension.includes('Konservasi Nilai')
    ) {
      // Non-negative balance and no uncontrolled debt
      dimPassed = accounts.availableCash >= 0 && accounts.debt === 0;
    } else if (
      rubric.evalMode === 'ARTIFACT_PRESENCE' ||
      rubric.dimension.includes('Kelengkapan Struktur') ||
      rubric.dimension.includes('Cetak Biru')
    ) {
      const artifact = rawSubmission.artifactData;
      if (artifact && typeof artifact === 'object') {
        // Collect all required fields from the boss mastery artifact structure
        const requiredFields = rubric.evalParams?.requiredFields ?? boss.masteryArtifact.sections.flatMap(sec => 
          sec.fields.map(f => (f as Record<string, unknown>).fieldId as string)
        );
        // Check that every required field is present in the submission
        dimPassed = requiredFields.every(fieldId => artifact[fieldId] !== undefined && artifact[fieldId] !== null);
      } else {
        dimPassed = false;
      }
    } else if (rubric.evalMode === 'ARTIFACT_VALUE_MATCH') {
       const artifact = rawSubmission.artifactData;
       if (artifact && typeof artifact === 'object' && rubric.evalParams?.expectedValues) {
           dimPassed = Object.entries(rubric.evalParams.expectedValues).every(([k, v]) => artifact[k] === v);
       } else {
           dimPassed = false;
       }
    } else if (
      rubric.evalMode === 'TRANSFER_SCENARIO' || 
      rubric.dimension.includes('Penerapan') || 
      rubric.dimension.includes('Transfer')
    ) {
      // Deterministic transfer scenario check
      const expectedId = rubric.evalParams?.transferOptionId;
      const submittedId = rawSubmission.transferOptionId;
      if (expectedId !== undefined) {
        dimPassed = (submittedId === expectedId);
      } else {
        // Fail closed if content hasn't been updated to provide expected transfer ID
        dimPassed = false;
      }
    } else {
      // FAIL-CLOSED for unknown rubric or missing explicit condition
      dimPassed = false;
    }

    const score = dimPassed ? rubric.weight : 0;
    totalScore += score;

    rubricBreakdown.push({
      dimension: rubric.dimension,
      score,
      maxWeight: rubric.weight,
      passed: dimPassed,
    });
  }

  const passed = totalScore >= 75;

  return {
    passed,
    scoreMastery: totalScore,
    rubricBreakdown,
    masteryArtifactId: boss.masteryArtifact.artifactId,
  };
}
