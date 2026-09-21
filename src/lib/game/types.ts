export interface AccountState {
  availableCash: number;
  goalSavings: number;
  emergencyFund: number;
  debt: number;
  acquiredAssets?: string[];
}

export interface ChoiceOption {
  choiceId: string;
  label: string;
  intentDescription?: string;
  consequenceText: string;
  pedagogicalFeedback?: string;
  foxyReactionState?: string;
  nextNodeId: string;
  rewardPolicyKey?: string;
  deltaSimulatedMoney?: number;
  stateOperations?: {
    inflow?: number;
    outflow?: number;
    expense?: number;
    debtIncurred?: number;
    debtRepaid?: number;
    transfers?: Array<{
      source: keyof AccountState;
      target: keyof AccountState;
      amount: number;
    }>;
  };
  requiredConditions?: {
    minCash?: number;
    minGoalSavings?: number;
  };
}

export interface SceneNode {
  nodeId: string;
  dayIndex?: number;
  monthIndex?: number;
  title: string;
  speaker?: string;
  narrativeText: string;
  foxyState?: string;
  contentWarning?: string | null;
  assumptionRef?: string;
  isTerminal?: boolean;
  choices?: ChoiceOption[];
  microlearning?: {
    conceptId: string;
    title: string;
    coreAnalogy?: string;
    keyTakeaway?: string;
  };
  transferScenario?: {
    questionId: string;
    context?: string;
    prompt: string;
    options: Array<{
      optionId: string;
      text: string;
      isCorrect: boolean;
      explanation?: string;
    }>;
  };
}

export interface MiniGameItem {
  itemId: string;
  name: string;
  category: string;
  explanation?: string;
}

export interface MiniGameSimulationScenario {
  scenarioId: string;
  title: string;
  description: string;
  shockAmount: number;
  shockAccount: string;
  mitigationOptions: Array<{
    optionId: string;
    label: string;
    isRecommended: boolean;
    rationale?: string;
  }>;
}

export interface MiniGame {
  gameId: string;
  title: string;
  gameType: string; // 'categorization' | 'allocation_simulation'
  concept: string;
  timeLimitSeconds: number;
  passThresholdPercent: number;
  accessibleInputSupported?: boolean;
  items?: MiniGameItem[];
  simulationScenarios?: MiniGameSimulationScenario[];
}

export type BossEvalMode = 'BALANCE_INTEGRITY' | 'ARTIFACT_PRESENCE' | 'ARTIFACT_VALUE_MATCH' | 'TRANSFER_SCENARIO';

export interface BossRubricItem {
  dimension: string;
  passCondition: string;
  weight: number;
  evalMode: BossEvalMode;
  evalParams?: {
    requiredFields?: string[];
    expectedValues?: Record<string, string | number | boolean>;
    transferOptionId?: string;
  };
}

export interface BossChallenge {
  bossId: string;
  title: string;
  scenario: string;
  criteria: string;
  maxAttemptsBeforeSupportHint?: number;
  rewardPolicyKey: string;
  evaluationRubric: BossRubricItem[];
  masteryArtifact: {
    artifactId: string;
    artifactName: string;
    documentTitle: string;
    sections: Array<{
      sectionId: string;
      title: string;
      fields: Array<Record<string, unknown>>;
    }>;
  };
}

export interface Chapter {
  chapterId: string;
  chapterIndex: number;
  title: string;
  themeCode: string;
  subtitle?: string;
  scopeExplanation?: string;
  prerequisites: string[];
  learningObjectives: string[];
  initialAccounts: AccountState;
  targetIdentity: string;
  badge: {
    badgeId: string;
    name: string;
    description: string;
    assetKey: string;
  };
  entrypointNodeId: string;
  terminalNodeIds: string[];
  scenes: SceneNode[];
  miniGame?: MiniGame;
  bossChallenge?: BossChallenge;
}

export interface RewardPolicy {
  xp: number;
  coin: number;
  badgeId?: string;
  rule: 'once_per_node' | 'first_pass_only';
}

export interface ContentManifest {
  schemaVersion: string;
  releaseId: string;
  status: string;
  locale: string;
  title: string;
  description: string;
  publishedAt: string | null;
  chapterFiles: string[];
  rewardPolicies: Record<string, RewardPolicy>;
  assetDictionary: string[];
}

export interface RewardGrant {
  type: string; // 'xp' | 'coin' | 'star' | 'badge'
  amount: number;
  badgeId?: string;
  sourceNodeId: string;
}

export interface CanonicalConsequence {
  sceneNodeId: string;
  choiceId?: string;
  deltaSimulatedMoney: number;
  newAccounts: AccountState;
  rewardsAwarded: RewardGrant[];
  nextNodeId: string;
  foxyReaction?: string;
}

export type ActionStatus = 'accepted' | 'duplicate' | 'conflict' | 'rejected';

export interface ActionProcessingResult {
  actionId: string;
  status: ActionStatus;
  code: string;
  message: string;
  retryable: boolean;
  canonicalConsequence?: CanonicalConsequence;
}

export interface CanonicalSnapshot {
  attemptId: string | null;
  chapterId: string | null;
  currentNodeId: string | null;
  accounts: AccountState | null;
  totalXp: number;
  totalStars: number;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  completedChapters: string[];
  identity: string;
}

export interface SyncActionInput {
  actionId: string;
  attemptId?: string;
  clientSequence: number;
  actionType:
    | 'START_PLAYTHROUGH'
    | 'CHOICE_SELECTED'
    | 'COMPLETE_MICROLEARNING'
    | 'SUBMIT_MINIGAME'
    | 'SUBMIT_BOSS';
  sceneNodeId?: string;
  choiceId?: string;
  contentVersion?: string;
  clientOccurredAt?: string;
  payload?: Record<string, unknown>;
}

export interface SyncBatchRequest {
  protocolVersion?: string;
  batchId: string;
  installationId?: string;
  lastServerCursor?: string;
  actions: SyncActionInput[];
}

export interface SyncBatchResponse {
  batchId: string;
  results: ActionProcessingResult[];
  nextServerCursor: string;
  canonicalSnapshot: CanonicalSnapshot;
  contentNotice: {
    latestActiveReleaseId: string;
    requiresUpdate: boolean;
  };
  serverTime: string;
}
