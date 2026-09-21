import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateChoiceTransition,
  evaluateBossChallenge,
  DomainValidationError,
} from '../../src/lib/game/narrative-engine.ts';
// Removed TS types for JS compat
describe('Narrative Engine - evaluateChoiceTransition', () => {
  const dummyChapter = {
    chapterId: 'test-chapter',
    chapterIndex: 1,
    title: 'Test',
    themeCode: 'TEST',
    prerequisites: [],
    learningObjectives: [],
    initialAccounts: {
      availableCash: 10000,
      goalSavings: 0,
      emergencyFund: 0,
      debt: 0,
    },
    targetIdentity: 'Test',
    badge: { badgeId: 'b1', name: 'Badge', description: 'Test', assetKey: 'img' },
    entrypointNodeId: 'node1',
    terminalNodeIds: ['end'],
    scenes: [
      {
        nodeId: 'node1',
        title: 'Node 1',
        narrativeText: 'Test text',
        choices: [
          {
            choiceId: 'choice-transfer',
            label: 'Transfer to Savings',
            consequenceText: 'Saved',
            nextNodeId: 'node2',
            stateOperations: {
              transfers: [{ source: 'availableCash', target: 'goalSavings', amount: 2000 }],
            },
          },
          {
            choiceId: 'choice-inflow',
            label: 'Earn money',
            consequenceText: 'Earned',
            nextNodeId: 'node2',
            stateOperations: {
              inflow: 5000,
            },
          },
          {
            choiceId: 'choice-debt',
            label: 'Take debt',
            consequenceText: 'Debt taken',
            nextNodeId: 'node2',
            stateOperations: {
              debtIncurred: 3000,
            },
          },
          {
            choiceId: 'choice-repay',
            label: 'Repay debt',
            consequenceText: 'Debt repaid',
            nextNodeId: 'node2',
            stateOperations: {
              debtRepaid: 1500,
            },
          },
        ],
      },
      {
        nodeId: 'node2',
        title: 'Node 2',
        narrativeText: 'Node 2',
        isTerminal: false,
      }
    ],
  };

  it('should process transfers correctly', () => {
    const currentAccounts = { availableCash: 5000, goalSavings: 1000, emergencyFund: 0, debt: 0 };
    const res = evaluateChoiceTransition(dummyChapter, currentAccounts, 'node1', 'choice-transfer');
    assert.equal(res.newAccounts.availableCash, 3000);
    assert.equal(res.newAccounts.goalSavings, 3000);
  });

  it('should process inflow correctly', () => {
    const currentAccounts = { availableCash: 5000, goalSavings: 0, emergencyFund: 0, debt: 0 };
    const res = evaluateChoiceTransition(dummyChapter, currentAccounts, 'node1', 'choice-inflow');
    assert.equal(res.newAccounts.availableCash, 10000);
  });

  it('should process debtIncurred correctly', () => {
    const currentAccounts = { availableCash: 1000, goalSavings: 0, emergencyFund: 0, debt: 0 };
    const res = evaluateChoiceTransition(dummyChapter, currentAccounts, 'node1', 'choice-debt');
    assert.equal(res.newAccounts.availableCash, 4000);
    assert.equal(res.newAccounts.debt, 3000);
  });

  it('should process debtRepaid correctly', () => {
    const currentAccounts = { availableCash: 5000, goalSavings: 0, emergencyFund: 0, debt: 3000 };
    const res = evaluateChoiceTransition(dummyChapter, currentAccounts, 'node1', 'choice-repay');
    assert.equal(res.newAccounts.availableCash, 3500);
    assert.equal(res.newAccounts.debt, 1500);
  });

  it('should fail debtRepaid if insufficient funds', () => {
    const currentAccounts = { availableCash: 1000, goalSavings: 0, emergencyFund: 0, debt: 3000 };
    assert.throws(() => {
      evaluateChoiceTransition(dummyChapter, currentAccounts, 'node1', 'choice-repay');
    }, DomainValidationError);
  });
});

describe('Narrative Engine - evaluateBossChallenge', () => {
  const dummyBoss = {
    bossId: 'boss1',
    title: 'Boss 1',
    scenario: 'Test',
    criteria: 'Test',
    rewardPolicyKey: 'boss-reward',
    masteryArtifact: {
      artifactId: 'artifact1',
      artifactName: 'Artifact',
      documentTitle: 'Doc',
      sections: [
        {
          sectionId: 'sec1',
          title: 'Sec',
          fields: [
            { fieldId: 'field_A', label: 'A' },
            { fieldId: 'field_B', label: 'B' },
          ],
        },
      ],
    },
    evaluationRubric: [
      { dimension: 'Integritas Saldo', passCondition: 'non-negative', weight: 40 },
      { dimension: 'Kelengkapan Struktur', passCondition: 'all fields', weight: 35 },
      { dimension: 'Penerapan Skenario', passCondition: 'correct choice', weight: 25 },
    ],
  };

  const dummyChapter = {
    chapterId: 'test-chapter',
    chapterIndex: 1,
    title: 'Test',
    themeCode: 'TEST',
    prerequisites: [],
    learningObjectives: [],
    initialAccounts: { availableCash: 10000, goalSavings: 0, emergencyFund: 0, debt: 0 },
    targetIdentity: 'Test',
    badge: { badgeId: 'b1', name: 'Badge', description: 'Test', assetKey: 'img' },
    entrypointNodeId: 'node1',
    terminalNodeIds: [],
    scenes: [],
    bossChallenge: dummyBoss,
  };

  it('should pass dimension 1 and 2 and achieve >= 75 score to pass overall, while dimension 3 fails deterministically', () => {
    const accounts = { availableCash: 1000, goalSavings: 0, emergencyFund: 0, debt: 0 };
    const artifactData = { field_A: 'val1', field_B: 'val2' };
    
    const res = evaluateBossChallenge(dummyChapter, dummyBoss, { accounts, artifactData, transferOptionId: 'opt1' });
    
    assert.equal(res.passed, true); // 40 + 35 = 75 >= 75
    assert.equal(res.scoreMastery, 75);
    
    const dim1 = res.rubricBreakdown.find(r => r.dimension === 'Integritas Saldo');
    const dim2 = res.rubricBreakdown.find(r => r.dimension === 'Kelengkapan Struktur');
    const dim3 = res.rubricBreakdown.find(r => r.dimension === 'Penerapan Skenario');
    
    assert.equal(dim1?.passed, true);
    assert.equal(dim2?.passed, true);
    assert.equal(dim3?.passed, false); // always fails deterministically
  });

  it('should fail dimension 2 if a required field is missing', () => {
    const accounts = { availableCash: 1000, goalSavings: 0, emergencyFund: 0, debt: 0 };
    const artifactData = { field_A: 'val1' }; // missing field_B
    
    const res = evaluateBossChallenge(dummyChapter, dummyBoss, { accounts, artifactData });
    
    assert.equal(res.passed, false); // only 40 points
    
    const dim2 = res.rubricBreakdown.find(r => r.dimension === 'Kelengkapan Struktur');
    assert.equal(dim2?.passed, false);
  });
});
