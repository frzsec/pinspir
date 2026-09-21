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
    if (choice.stateOperations.allocation) {
      const { source, target, amount } = choice.stateOperations.allocation;
      const allocAmount = amount ?? 0;
      if (source === 'availableCash' && target === 'goalSavings') {
        if (newAccounts.availableCash < allocAmount) {
          throw new DomainValidationError('INSUFFICIENT_CASH', 'Saldo kas tidak cukup untuk dialokasikan.');
        }
        newAccounts.availableCash -= allocAmount;
        newAccounts.goalSavings += allocAmount;
      } else if (source === 'availableCash' && target === 'emergencyFund') {
        if (newAccounts.availableCash < allocAmount) {
          throw new DomainValidationError('INSUFFICIENT_CASH', 'Saldo kas tidak cukup untuk dialokasikan.');
        }
        newAccounts.availableCash -= allocAmount;
        newAccounts.emergencyFund += allocAmount;
      }
    } else if (choice.stateOperations.expense !== undefined) {
      delta = -choice.stateOperations.expense;
      newAccounts.availableCash += delta;
    } else if (choice.stateOperations.income !== undefined) {
      delta = choice.stateOperations.income;
      newAccounts.availableCash += delta;
    }
  } else {
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
      rubric.dimension.includes('Integritas Saldo') ||
      rubric.dimension.includes('Konservasi Nilai')
    ) {
      // Non-negative balance and no uncontrolled debt
      dimPassed = accounts.availableCash >= 0 && accounts.debt === 0;
    } else if (
      rubric.dimension.includes('Kelengkapan Struktur') ||
      rubric.dimension.includes('Cetak Biru')
    ) {
      // Must have artifact data provided and non-empty
      const artifact = rawSubmission.artifactData;
      dimPassed = Boolean(artifact && typeof artifact === 'object' && Object.keys(artifact).length >= 3);
    } else if (rubric.dimension.includes('Penerapan') || rubric.dimension.includes('Transfer')) {
      // Check transfer question submission
      const optionId = rawSubmission.transferOptionId;
      // If provided, check if valid option ID
      dimPassed = Boolean(optionId && !optionId.includes('fail') && !optionId.includes('opt3'));
    } else {
      dimPassed = true;
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
