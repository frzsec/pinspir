#!/usr/bin/env node

/**
 * Finspire Content Release Integrity Validator (Fase 01R)
 *
 * Runs without external npm dependencies (pure Node.js built-in modules).
 * Implements full recursive JSON Schema 2020-12 enforcement ($ref resolution,
 * nested properties, array items, additionalProperties: false, and type constraints),
 * outcome progression tracking, finite path enumeration, balance conservation,
 * decision status verification, and regression safety.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const CONTENT_DIR = path.join(REPO_ROOT, 'content');
const RELEASES_DIR = path.join(CONTENT_DIR, 'releases');
const SCHEMA_FILE = path.join(CONTENT_DIR, 'schema', 'content-release.schema.json');
const DECISIONS_FILE = path.join(REPO_ROOT, 'docs', 'content', 'OPEN_DECISIONS.md');

export class ContentValidator {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || REPO_ROOT;
    this.contentDir = options.contentDir || CONTENT_DIR;
    this.releasesDir = options.releasesDir || RELEASES_DIR;
    this.schemaFile = options.schemaFile || SCHEMA_FILE;
    this.decisionsFile = options.decisionsFile || DECISIONS_FILE;
    this.silent = options.silent || false;

    this.errors = [];
    this.warnings = [];
    this.stats = {
      releasesChecked: 0,
      chaptersChecked: 0,
      scenesChecked: 0,
      choicesChecked: 0,
      transferScenariosChecked: 0,
      minigamesChecked: 0,
      bossesChecked: 0,
      artifactsChecked: 0,
      ch1Paths: { total: 0, pass: 0, failSoft: 0, invalid: 0 },
      ch2Paths: { total: 0, pass: 0, failSoft: 0, invalid: 0 }
    };

    this.schema = null;
    this.activeDecisionIds = new Set();
    this.supersededDecisionIds = new Set();
    this.globalIds = new Set();
  }

  recordError(scope, message) {
    this.errors.push(`[ERROR] [${scope}] ${message}`);
  }

  recordWarning(scope, message) {
    this.warnings.push(`[WARN]  [${scope}] ${message}`);
  }

  log(msg) {
    if (!this.silent) {
      console.log(msg);
    }
  }

  loadDecisions() {
    if (!fs.existsSync(this.decisionsFile)) {
      this.recordError('OPEN_DECISIONS', `File keputusan tidak ditemukan: ${this.decisionsFile}`);
      return;
    }
    const content = fs.readFileSync(this.decisionsFile, 'utf-8');
    const lines = content.split('\n');

    let currentId = null;
    let currentStatus = null;

    for (const line of lines) {
      const idMatch = line.match(/###\s+\d+\.\s+`(DEC-[A-Z0-9-]+)`/);
      if (idMatch) {
        if (currentId && currentStatus) {
          if (currentStatus.includes('SUPERSEDED')) {
            this.supersededDecisionIds.add(currentId);
          } else {
            this.activeDecisionIds.add(currentId);
          }
        }
        currentId = idMatch[1];
        currentStatus = null;
      }
      if (currentId && line.includes('- **Status**:')) {
        currentStatus = line;
      }
    }
    if (currentId && currentStatus) {
      if (currentStatus.includes('SUPERSEDED')) {
        this.supersededDecisionIds.add(currentId);
      } else {
        this.activeDecisionIds.add(currentId);
      }
    }
  }

  loadSchema() {
    if (!fs.existsSync(this.schemaFile)) {
      this.recordError('SCHEMA', `Schema file tidak ditemukan: ${this.schemaFile}`);
      return false;
    }
    try {
      const raw = fs.readFileSync(this.schemaFile, 'utf-8');
      this.schema = JSON.parse(raw);
      return true;
    } catch (err) {
      this.recordError('SCHEMA', `Gagal mem-parse JSON Schema: ${err.message}`);
      return false;
    }
  }

  resolveRef(ref) {
    if (!this.schema) return null;
    if (!ref.startsWith('#/')) {
      throw new Error(`Unsupported schema $ref format: ${ref}`);
    }
    const parts = ref.substring(2).split('/');
    let curr = this.schema;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && part in curr) {
        curr = curr[part];
      } else {
        throw new Error(`Cannot resolve schema $ref: ${ref} (failed at '${part}')`);
      }
    }
    return curr;
  }

  /**
   * Complete recursive JSON Schema 2020-12 evaluator supporting:
   * - $ref resolution
   * - oneOf, anyOf, allOf
   * - single and multi-type checking
   * - required properties
   * - additionalProperties: false and sub-schema additionalProperties
   * - nested properties
   * - array items schema, minItems, maxItems
   * - string minLength, maxLength, pattern, enum, const
   * - number minimum, maximum, enum, const
   */
  validateValueAgainstSchema(val, def, scope, propPath = 'root', collectLocalErrors = null) {
    const errs = collectLocalErrors || [];
    const addError = (msg) => {
      if (collectLocalErrors) {
        errs.push(`[${propPath}] ${msg}`);
      } else {
        this.recordError(scope, `[${propPath}] ${msg}`);
      }
    };

    if (!def || typeof def !== 'object') return;

    // Handle $ref
    if (def.$ref) {
      try {
        const resolved = this.resolveRef(def.$ref);
        this.validateValueAgainstSchema(val, resolved, scope, propPath, collectLocalErrors);
      } catch (e) {
        addError(e.message);
      }
      return;
    }

    // Handle oneOf
    if (def.oneOf && Array.isArray(def.oneOf)) {
      let matches = 0;
      for (const sub of def.oneOf) {
        const subErrs = [];
        this.validateValueAgainstSchema(val, sub, scope, propPath, subErrs);
        if (subErrs.length === 0) matches++;
      }
      if (matches !== 1) {
        addError(`Tidak memenuhi tepat 1 skema dalam oneOf (cocok: ${matches} dari ${def.oneOf.length})`);
      }
      return;
    }

    // Handle anyOf
    if (def.anyOf && Array.isArray(def.anyOf)) {
      let matches = 0;
      for (const sub of def.anyOf) {
        const subErrs = [];
        this.validateValueAgainstSchema(val, sub, scope, propPath, subErrs);
        if (subErrs.length === 0) matches++;
      }
      if (matches === 0) {
        addError(`Tidak memenuhi satupun skema dalam anyOf`);
      }
      return;
    }

    // Handle allOf
    if (def.allOf && Array.isArray(def.allOf)) {
      for (const sub of def.allOf) {
        this.validateValueAgainstSchema(val, sub, scope, propPath, collectLocalErrors);
      }
      return;
    }

    // Check type
    if (def.type) {
      const allowedTypes = Array.isArray(def.type) ? def.type : [def.type];
      let typeMatch = false;
      for (const t of allowedTypes) {
        if (t === 'null' && val === null) typeMatch = true;
        else if (t === 'string' && typeof val === 'string') typeMatch = true;
        else if (t === 'boolean' && typeof val === 'boolean') typeMatch = true;
        else if (t === 'integer' && typeof val === 'number' && Number.isInteger(val)) typeMatch = true;
        else if (t === 'number' && typeof val === 'number' && !Number.isNaN(val)) typeMatch = true;
        else if (t === 'array' && Array.isArray(val)) typeMatch = true;
        else if (t === 'object' && val !== null && typeof val === 'object' && !Array.isArray(val)) typeMatch = true;
      }
      if (!typeMatch) {
        const actual = val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val;
        addError(`Tipe data salah: diharapkan [${allowedTypes.join(', ')}], ditemukan: ${actual}`);
        return;
      }
    }

    if (val === null || val === undefined) return;

    // String constraints
    if (typeof val === 'string') {
      if (def.minLength !== undefined && val.length < def.minLength) {
        addError(`Panjang string (${val.length}) kurang dari minLength ${def.minLength}`);
      }
      if (def.maxLength !== undefined && val.length > def.maxLength) {
        addError(`Panjang string (${val.length}) lebih dari maxLength ${def.maxLength}`);
      }
      if (def.pattern) {
        const reg = new RegExp(def.pattern);
        if (!reg.test(val)) {
          addError(`String '${val}' tidak memenuhi pola regex ${def.pattern}`);
        }
      }
      if (def.enum && !def.enum.includes(val)) {
        addError(`Nilai '${val}' tidak ada di enum: [${def.enum.join(', ')}]`);
      }
      if (def.const !== undefined && val !== def.const) {
        addError(`Nilai '${val}' harus sama dengan const '${def.const}'`);
      }
    }

    // Number constraints
    if (typeof val === 'number') {
      if (def.minimum !== undefined && val < def.minimum) {
        addError(`Nilai ${val} kurang dari minimum ${def.minimum}`);
      }
      if (def.maximum !== undefined && val > def.maximum) {
        addError(`Nilai ${val} lebih dari maximum ${def.maximum}`);
      }
      if (def.enum && !def.enum.includes(val)) {
        addError(`Nilai ${val} tidak ada di enum: [${def.enum.join(', ')}]`);
      }
      if (def.const !== undefined && val !== def.const) {
        addError(`Nilai ${val} harus sama dengan const ${def.const}`);
      }
    }

    // Boolean constraints
    if (typeof val === 'boolean') {
      if (def.const !== undefined && val !== def.const) {
        addError(`Nilai ${val} harus sama dengan const ${def.const}`);
      }
    }

    // Array constraints
    if (Array.isArray(val)) {
      if (def.minItems !== undefined && val.length < def.minItems) {
        addError(`Jumlah item (${val.length}) kurang dari minItems ${def.minItems}`);
      }
      if (def.maxItems !== undefined && val.length > def.maxItems) {
        addError(`Jumlah item (${val.length}) lebih dari maxItems ${def.maxItems}`);
      }
      if (def.items) {
        for (let i = 0; i < val.length; i++) {
          this.validateValueAgainstSchema(val[i], def.items, scope, `${propPath}[${i}]`, collectLocalErrors);
        }
      }
    }

    // Object constraints
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if (def.required && Array.isArray(def.required)) {
        for (const req of def.required) {
          if (!(req in val) || val[req] === undefined) {
            addError(`Field wajib '${req}' tidak ditemukan`);
          }
        }
      }

      if (def.additionalProperties === false) {
        const allowed = new Set(def.properties ? Object.keys(def.properties) : []);
        for (const k of Object.keys(val)) {
          if (!allowed.has(k)) {
            addError(`Property '${k}' tidak diizinkan (additionalProperties: false)`);
          }
        }
      } else if (def.additionalProperties && typeof def.additionalProperties === 'object') {
        const known = new Set(def.properties ? Object.keys(def.properties) : []);
        for (const k of Object.keys(val)) {
          if (!known.has(k)) {
            this.validateValueAgainstSchema(val[k], def.additionalProperties, scope, `${propPath}.${k}`, collectLocalErrors);
          }
        }
      }

      if (def.properties) {
        for (const [k, pDef] of Object.entries(def.properties)) {
          if (k in val && val[k] !== undefined) {
            this.validateValueAgainstSchema(val[k], pDef, scope, `${propPath}.${k}`, collectLocalErrors);
          }
        }
      }
    }
  }

  checkForPlaceholders(obj, scope, currentPath = '') {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      if (trimmed.length === 0) {
        this.recordError(scope, `Ditemukan string kosong pada '${currentPath}'`);
      }
      const placeholderPattern = /^(TODO|TBD|WIP|FIXME|XXX)(\b|:|\s|$)/i;
      if (placeholderPattern.test(trimmed)) {
        this.recordError(scope, `Ditemukan placeholder '${trimmed}' pada '${currentPath}'`);
      }
      if (/https?:\/\/.*(\.webm|\.mp4|\.gif)/i.test(trimmed)) {
        this.recordError(scope, `Dilarang URL aset eksternal '${trimmed}' pada '${currentPath}'. Gunakan logical key (contoh: 'anim:foxy-idle').`);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, idx) => this.checkForPlaceholders(item, scope, `${currentPath}[${idx}]`));
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        this.checkForPlaceholders(obj[key], scope, currentPath ? `${currentPath}.${key}` : key);
      });
    }
  }

  validateChapter1Paths(chapter, scope) {
    const scenes = new Map(chapter.scenes.map((s) => [s.nodeId, s]));
    const entrypoint = chapter.entrypointNodeId;
    const terminalIds = new Set(chapter.terminalNodeIds || []);

    const visitedInBranch = new Set();

    const dfs = (currId, currentPath, cash, minCash) => {
      const node = scenes.get(currId);
      if (!node) {
        this.recordError(scope, `Simpul '${currId}' tidak ditemukan di daftar scenes (dangling pointer)`);
        this.stats.ch1Paths.invalid++;
        return;
      }

      if (visitedInBranch.has(currId)) {
        this.recordError(scope, `Siklus tak terbatas terdeteksi pada simpul '${currId}'`);
        this.stats.ch1Paths.invalid++;
        return;
      }

      if (node.isTerminal || terminalIds.has(currId)) {
        const termType = node.terminalType || (currId === 'CH1-PASS-SURVIVOR' ? 'pass' : 'fail_soft');
        const isNegative = minCash < 0 || cash < 0;

        if (isNegative) {
          this.stats.ch1Paths.invalid++;
          this.recordError(scope, `Jalur Chapter 1 berakhir invalid dengan saldo negatif: ${cash} (min: ${minCash})`);
          return;
        }

        if (termType === 'pass') {
          if (cash < 1000) {
            this.stats.ch1Paths.invalid++;
            this.recordError(scope, `Jalur Pass Chapter 1 tidak memenuhi saldo cadangan aman minimal Rp1.000: sisa=${cash}`);
            return;
          }
          this.stats.ch1Paths.pass++;
        } else {
          if (cash >= 1000) {
            this.stats.ch1Paths.invalid++;
            this.recordError(scope, `Jalur Fail-soft Chapter 1 memiliki saldo >= Rp1.000 (seharusnya pass): sisa=${cash}`);
            return;
          }
          this.stats.ch1Paths.failSoft++;
        }
        this.stats.ch1Paths.total++;
        return;
      }

      const choices = node.choices || [];
      if (choices.length === 0) {
        this.recordError(scope, `Simpul non-terminal '${currId}' tidak memiliki choices`);
        this.stats.ch1Paths.invalid++;
        return;
      }

      visitedInBranch.add(currId);
      let affordableCount = 0;

      for (const choice of choices) {
        const delta = choice.deltaSimulatedMoney || 0;
        const reqs = choice.requiredConditions || {};
        const reqMinCash = reqs.minCash !== undefined ? reqs.minCash : 0;
        const reqMaxCash = reqs.maxCash !== undefined ? reqs.maxCash : Infinity;

        if (cash < reqMinCash || cash > reqMaxCash) {
          // Condition gating routes the player deterministically based on cash state
          continue;
        }

        affordableCount++;
        const nextCash = cash + delta;

        if (nextCash < 0) {
          this.recordError(scope, `Pilihan '${choice.choiceId}' pada '${currId}' menyebabkan saldo negatif: ${nextCash}`);
          this.stats.ch1Paths.invalid++;
          continue;
        }

        const nextMin = Math.min(minCash, nextCash);
        dfs(choice.nextNodeId, [...currentPath, choice.choiceId], nextCash, nextMin);
      }

      if (affordableCount === 0) {
        this.recordError(scope, `Simpul '${currId}' tidak memiliki pilihan yang memenuhi kondisi saldo saat ini: ${cash}`);
        this.stats.ch1Paths.invalid++;
      }

      visitedInBranch.delete(currId);
    };

    const initialCash = (chapter.initialAccounts && chapter.initialAccounts.availableCash) || 0;
    dfs(entrypoint, [entrypoint], initialCash, initialCash);
  }

  validateChapter2Paths(chapter, scope) {
    const scenes = new Map(chapter.scenes.map((s) => [s.nodeId, s]));
    const entrypoint = chapter.entrypointNodeId;
    const terminalIds = new Set(chapter.terminalNodeIds || []);
    const validMonthlyIncomeNodes = new Set(['CH2-SC-01', 'CH2-SC-03', 'CH2-SC-05']);

    const visitedInBranch = new Set();

    const dfs = (currId, currentPath, acc, totalInflow, totalExpense) => {
      const node = scenes.get(currId);
      if (!node) {
        this.recordError(scope, `Simpul '${currId}' tidak ditemukan di daftar scenes`);
        this.stats.ch2Paths.invalid++;
        return;
      }

      if (visitedInBranch.has(currId)) {
        this.recordError(scope, `Siklus tak terbatas terdeteksi di Chapter 2 pada simpul '${currId}'`);
        this.stats.ch2Paths.invalid++;
        return;
      }

      if (node.isTerminal || terminalIds.has(currId)) {
        const termType = node.terminalType || (currId === 'CH2-PASS-PLANNER' ? 'pass' : 'fail_soft');
        const balanceSum = acc.availableCash + acc.goalSavings + acc.emergencyFund + totalExpense - acc.debt;

        if (acc.debt < 0) {
          this.stats.ch2Paths.invalid++;
          this.recordError(scope, `Jalur Chapter 2 berakhir invalid dengan nilai utang negatif: ${acc.debt}`);
          return;
        }

        if (acc.availableCash < 0 || acc.goalSavings < 0 || acc.emergencyFund < 0) {
          this.stats.ch2Paths.invalid++;
          this.recordError(scope, `Jalur Chapter 2 berakhir invalid dengan saldo negatif: cash=${acc.availableCash}, goal=${acc.goalSavings}, emergency=${acc.emergencyFund}`);
          return;
        }

        if (balanceSum !== totalInflow || totalInflow !== 300000) {
          this.stats.ch2Paths.invalid++;
          this.recordError(scope, `Jalur Chapter 2 melanggar konservasi saldo: inflow=${totalInflow}, calculated=${balanceSum}`);
          return;
        }

        if (termType === 'pass') {
          if (acc.debt > 0) {
            this.stats.ch2Paths.invalid++;
            this.recordError(scope, `Jalur Pass Chapter 2 berakhir dengan utang belum lunas: debt=${acc.debt}`);
            return;
          }
          if (acc.emergencyFund < 50000) {
            this.stats.ch2Paths.invalid++;
            this.recordError(scope, `Jalur Pass Chapter 2 tidak mencapai target dana darurat Rp50.000: emergencyFund=${acc.emergencyFund}`);
            return;
          }
          this.stats.ch2Paths.pass++;
        } else {
          if (acc.debt === 0 && acc.emergencyFund >= 50000) {
            this.stats.ch2Paths.invalid++;
            this.recordError(scope, `Jalur Fail-soft Chapter 2 memiliki kondisi bebas utang dan dana darurat cukup (seharusnya pass)`);
            return;
          }
          this.stats.ch2Paths.failSoft++;
        }
        this.stats.ch2Paths.total++;
        return;
      }

      const choices = node.choices || [];
      if (choices.length === 0) {
        this.recordError(scope, `Simpul non-terminal '${currId}' tidak memiliki choices`);
        this.stats.ch2Paths.invalid++;
        return;
      }

      visitedInBranch.add(currId);
      let affordableCount = 0;

      for (const choice of choices) {
        const ops = choice.stateOperations || {};
        const reqs = choice.requiredConditions || {};

        if (reqs.minCash !== undefined && acc.availableCash < reqs.minCash) continue;
        if (reqs.maxCash !== undefined && acc.availableCash > reqs.maxCash) continue;
        if (reqs.minEmergencyFund !== undefined && acc.emergencyFund < reqs.minEmergencyFund) continue;
        if (reqs.maxEmergencyFund !== undefined && acc.emergencyFund > reqs.maxEmergencyFund) continue;
        if (reqs.minGoalSavings !== undefined && acc.goalSavings < reqs.minGoalSavings) continue;
        if (reqs.maxGoalSavings !== undefined && acc.goalSavings > reqs.maxGoalSavings) continue;
        if (reqs.minDebt !== undefined && acc.debt < reqs.minDebt) continue;
        if (reqs.maxDebt !== undefined && acc.debt > reqs.maxDebt) continue;

        affordableCount++;
        const nextAcc = { ...acc };
        const inflow = ops.inflow || 0;
        const expense = ops.expense || 0;
        const debtIncurred = ops.debtIncurred || 0;
        const debtRepaid = ops.debtRepaid || 0;

        if (inflow > 0 && !validMonthlyIncomeNodes.has(currId)) {
          this.recordError(scope, `Inflow tidak sah pada simpul '${currId}': melanggar konservasi saldo arus kas bulanan`);
          this.stats.ch2Paths.invalid++;
          continue;
        }

        const nextInflow = totalInflow + inflow;
        const nextExpense = totalExpense + expense;

        nextAcc.availableCash += inflow;

        const transferList = ops.transfers || (ops.transfer ? [ops.transfer] : []);
        let transferFailed = false;
        for (const t of transferList) {
          const { from, to, amount } = t;
          if (from === to) {
            this.recordError(scope, `Transfer tidak sah: sumber dan tujuan sama '${from}'`);
            this.stats.ch2Paths.invalid++;
            transferFailed = true;
            break;
          }
          if (amount <= 0) {
            this.recordError(scope, `Transfer tidak sah: amount harus positif, ditemukan: ${amount}`);
            this.stats.ch2Paths.invalid++;
            transferFailed = true;
            break;
          }
          if (nextAcc[from] < amount) {
            this.recordError(scope, `Transfer gagal: saldo '${from}' (${nextAcc[from]}) kurang dari ${amount}`);
            this.stats.ch2Paths.invalid++;
            transferFailed = true;
            break;
          }
          nextAcc[from] -= amount;
          nextAcc[to] += amount;
        }
        if (transferFailed) continue;

        nextAcc.debt += debtIncurred;
        nextAcc.debt -= debtRepaid;
        nextAcc.availableCash -= debtRepaid;

        if (nextAcc.debt < 0) {
          this.recordError(scope, `Pilihan '${choice.choiceId}' pada '${currId}' menyebabkan nilai utang negatif: ${nextAcc.debt}`);
          this.stats.ch2Paths.invalid++;
          continue;
        }

        if (expense > 0) {
          if ((reqs.minEmergencyFund || 0) >= expense) {
            nextAcc.emergencyFund -= expense;
          } else if (debtIncurred >= expense) {
            // financed via debt
          } else if ((reqs.minGoalSavings || 0) >= expense) {
            nextAcc.goalSavings -= expense;
          } else {
            nextAcc.availableCash -= expense;
          }
        }

        dfs(choice.nextNodeId, [...currentPath, choice.choiceId], nextAcc, nextInflow, nextExpense);
      }

      if (affordableCount === 0) {
        this.recordError(scope, `Simpul '${currId}' tidak memiliki pilihan yang memenuhi kondisi saldo/utang saat ini`);
        this.stats.ch2Paths.invalid++;
      }

      visitedInBranch.delete(currId);
    };

    const initialAcc = {
      availableCash: chapter.initialAccounts.availableCash || 0,
      goalSavings: chapter.initialAccounts.goalSavings || 0,
      emergencyFund: chapter.initialAccounts.emergencyFund || 0,
      debt: chapter.initialAccounts.debt || 0
    };

    dfs(entrypoint, [entrypoint], initialAcc, 0, 0);
  }

  validateChapter(chapter, manifest, scope, producedOutcomesInRelease) {
    this.stats.chaptersChecked++;

    // 1. Recursive JSON Schema validation against chapter definition
    if (this.schema && this.schema.$defs && this.schema.$defs.chapter) {
      this.validateValueAgainstSchema(chapter, { $ref: '#/$defs/chapter' }, scope, chapter.chapterId || 'chapter');
    }

    if (this.globalIds.has(chapter.chapterId)) {
      this.recordError(scope, `chapterId '${chapter.chapterId}' duplikat di tingkat rilis`);
    } else {
      this.globalIds.add(chapter.chapterId);
    }

    const assetDictSet = new Set(manifest.assetDictionary || []);
    if (chapter.badge && chapter.badge.assetKey) {
      if (!assetDictSet.has(chapter.badge.assetKey)) {
        this.recordError(scope, `Badge assetKey '${chapter.badge.assetKey}' tidak terdaftar di manifest.assetDictionary`);
      }
    }

    const scenes = chapter.scenes || [];
    const sceneMap = new Map();
    const chapterProducedOutcomes = new Set();

    scenes.forEach((scene, sIdx) => {
      this.stats.scenesChecked++;
      const scScope = `${scope}.${scene.nodeId || `scene[${sIdx}]`}`;

      if (!scene.nodeId) {
        this.recordError(scScope, `Scene tidak memiliki nodeId`);
        return;
      }
      if (this.globalIds.has(scene.nodeId)) {
        this.recordError(scScope, `nodeId '${scene.nodeId}' duplikat`);
      } else {
        this.globalIds.add(scene.nodeId);
      }
      sceneMap.set(scene.nodeId, scene);

      // Check assumptionRef against active decisions
      if (scene.assumptionRef) {
        if (this.supersededDecisionIds.has(scene.assumptionRef)) {
          this.recordError(scScope, `Scene mereferensikan decision ID yang telah SUPERSEDED: '${scene.assumptionRef}'`);
        } else if (!this.activeDecisionIds.has(scene.assumptionRef)) {
          this.recordError(scScope, `assumptionRef '${scene.assumptionRef}' tidak terdaftar di docs/content/OPEN_DECISIONS.md`);
        }
      }

      // Check consumedPreconditions outcome chain
      if (Array.isArray(scene.consumedPreconditions)) {
        for (const tag of scene.consumedPreconditions) {
          const isProduced = producedOutcomesInRelease.has(tag) || chapterProducedOutcomes.has(tag);
          if (!isProduced) {
            this.recordError(scScope, `consumedPreconditions '${tag}' belum pernah diproduksi oleh chapter sebelumnya atau scene pendahulu`);
          }
        }
      }

      // Register producedOutcomeTags
      if (Array.isArray(scene.producedOutcomeTags)) {
        for (const tag of scene.producedOutcomeTags) {
          chapterProducedOutcomes.add(tag);
          producedOutcomesInRelease.add(tag);
        }
      }

      if (scene.transferScenario) {
        this.stats.transferScenariosChecked++;
        const tq = scene.transferScenario;
        const correctCount = (tq.options || []).filter((o) => o.isCorrect).length;
        if (correctCount !== 1) {
          this.recordError(scScope, `transferScenario '${tq.questionId}' harus memiliki tepat 1 opsi benar, ditemukan: ${correctCount}`);
        }
      }

      const choices = scene.choices || [];
      choices.forEach((choice, cIdx) => {
        this.stats.choicesChecked++;
        const cScope = `${scScope}.choice[${cIdx}:${choice.choiceId || 'no-id'}]`;

        if (!choice.choiceId) {
          this.recordError(cScope, `Choice tidak memiliki choiceId`);
        } else if (this.globalIds.has(choice.choiceId)) {
          this.recordError(cScope, `choiceId '${choice.choiceId}' duplikat`);
        } else {
          this.globalIds.add(choice.choiceId);
        }

        if (choice.rewardPolicyKey) {
          if (!manifest.rewardPolicies || !manifest.rewardPolicies[choice.rewardPolicyKey]) {
            this.recordError(cScope, `rewardPolicyKey '${choice.rewardPolicyKey}' tidak terdaftar di manifest.rewardPolicies`);
          }
        }
      });
    });

    // Check entrypoint
    if (!sceneMap.has(chapter.entrypointNodeId)) {
      this.recordError(scope, `entrypointNodeId '${chapter.entrypointNodeId}' tidak ditemukan di scenes`);
    }

    // Check terminalNodeIds
    const terminalNodeIds = chapter.terminalNodeIds || [];
    for (const termId of terminalNodeIds) {
      if (!sceneMap.has(termId)) {
        this.recordError(scope, `terminalNodeId '${termId}' tidak ditemukan di scenes`);
      }
    }

    // Mini-game validation
    if (chapter.miniGame) {
      this.stats.minigamesChecked++;
      const mg = chapter.miniGame;
      if (mg.accessibleInputSupported !== true) {
        this.recordError(`${scope}.miniGame`, `Mini-game wajib mendukung accessibleInputSupported: true`);
      }
      if (mg.gameType === 'categorization') {
        if (!Array.isArray(mg.items) || mg.items.length < 5) {
          this.recordError(`${scope}.miniGame`, `Mini-game categorization harus memiliki minimal 5 item`);
        }
      } else if (mg.gameType === 'allocation_simulation') {
        if (!Array.isArray(mg.simulationScenarios) || mg.simulationScenarios.length < 3) {
          this.recordError(`${scope}.miniGame`, `Mini-game allocation_simulation harus memiliki minimal 3 simulationScenarios`);
        }
      }
    }

    // Boss challenge & Rubric validation
    if (chapter.bossChallenge) {
      this.stats.bossesChecked++;
      const boss = chapter.bossChallenge;
      if (boss.masteryArtifact) {
        this.stats.artifactsChecked++;
        const artifact = boss.masteryArtifact;
        if (!artifact.artifactId || !artifact.sections || artifact.sections.length === 0) {
          this.recordError(`${scope}.bossChallenge.masteryArtifact`, `masteryArtifact tidak lengkap`);
        }
      } else {
        this.recordError(`${scope}.bossChallenge`, `bossChallenge wajib memiliki masteryArtifact terstruktur`);
      }

      if (boss.evaluationRubric && Array.isArray(boss.evaluationRubric)) {
        const rubric = boss.evaluationRubric;
        const totalWeight = rubric.reduce((sum, item) => sum + (item.weight || 0), 0);
        if (totalWeight !== 100) {
          this.recordError(`${scope}.bossChallenge.evaluationRubric`, `Total bobot evaluationRubric harus tepat 100, ditemukan: ${totalWeight}`);
        }
        for (const item of rubric) {
          if (item.weight > 100 || item.weight < 1) {
            this.recordError(`${scope}.bossChallenge.evaluationRubric`, `Bobot dimensi '${item.dimension}' (${item.weight}) di luar rentang 1-100`);
          }
        }
      }

      if (!boss.transferApplicationScenario) {
        this.recordError(`${scope}.bossChallenge`, `bossChallenge wajib memiliki transferApplicationScenario`);
      }
    }

    // Run chapter-specific path enumeration
    if (chapter.chapterId === 'chapter-01') {
      this.validateChapter1Paths(chapter, scope);
    } else if (chapter.chapterId === 'chapter-02') {
      this.validateChapter2Paths(chapter, scope);
    }
  }

  validateRelease(releaseDirName) {
    const releasePath = path.join(this.releasesDir, releaseDirName);
    const manifestPath = path.join(releasePath, 'manifest.json');
    const scope = `release:${releaseDirName}`;

    this.stats.releasesChecked++;

    if (!fs.existsSync(manifestPath)) {
      this.recordError(scope, `manifest.json tidak ditemukan di ${releasePath}`);
      return;
    }

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (err) {
      this.recordError(scope, `Gagal mem-parse manifest.json: ${err.message}`);
      return;
    }

    // Apply manifest schema definition recursively
    if (this.schema && this.schema.$defs && this.schema.$defs.manifest) {
      this.validateValueAgainstSchema(manifest, { $ref: '#/$defs/manifest' }, `${scope}:manifest`, 'manifest');
    }

    if (manifest.status === 'published') {
      this.recordError(scope, `Status rilis draft '${releaseDirName}' DILARANG 'published'. Harus 'draft' atau 'proposed'.`);
    }

    this.checkForPlaceholders(manifest, `${scope}:manifest`);

    const chapterFiles = manifest.chapterFiles || [];
    const producedOutcomesInRelease = new Set();

    chapterFiles.forEach((chapFile) => {
      const chapPath = path.join(releasePath, chapFile);
      if (!fs.existsSync(chapPath)) {
        this.recordError(scope, `File chapter '${chapFile}' tidak ditemukan di ${releasePath}`);
        return;
      }
      try {
        const chapData = JSON.parse(fs.readFileSync(chapPath, 'utf-8'));
        this.checkForPlaceholders(chapData, `${scope}:${chapFile}`);
        this.validateChapter(chapData, manifest, `${scope}:${chapFile}`, producedOutcomesInRelease);
      } catch (err) {
        this.recordError(scope, `Gagal mem-parse file '${chapFile}': ${err.message}`);
      }
    });
  }

  run() {
    this.log('=== Finspire Content Release Validator (Fase 01R) ===');
    this.log(`Repository Root   : ${this.repoRoot}`);
    this.log(`Schema File       : ${path.relative(this.repoRoot, this.schemaFile)}`);
    this.log(`Decisions File    : ${path.relative(this.repoRoot, this.decisionsFile)}`);

    this.loadDecisions();
    this.loadSchema();

    if (!fs.existsSync(this.releasesDir)) {
      this.recordError('GLOBAL', `Direktori rilis konten tidak ditemukan: ${this.releasesDir}`);
    } else {
      const releases = fs.readdirSync(this.releasesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();

      if (releases.length === 0) {
        this.recordError('GLOBAL', `Tidak ditemukan subdirektori rilis di ${this.releasesDir}`);
      } else {
        releases.forEach((rName) => this.validateRelease(rName));
      }
    }

    this.log('\n--- Hasil Verifikasi Konten ---');
    this.log(`Releases checked        : ${this.stats.releasesChecked}`);
    this.log(`Chapters checked        : ${this.stats.chaptersChecked}`);
    this.log(`Scenes checked          : ${this.stats.scenesChecked}`);
    this.log(`Choices checked         : ${this.stats.choicesChecked}`);
    this.log(`Transfer scenarios      : ${this.stats.transferScenariosChecked}`);
    this.log(`Mini-games checked      : ${this.stats.minigamesChecked}`);
    this.log(`Bosses checked          : ${this.stats.bossesChecked}`);
    this.log(`Mastery artifacts       : ${this.stats.artifactsChecked}`);
    this.log(`Chapter 1 finite paths  : Total ${this.stats.ch1Paths.total} (Pass: ${this.stats.ch1Paths.pass}, Fail-soft: ${this.stats.ch1Paths.failSoft}, Invalid: ${this.stats.ch1Paths.invalid})`);
    this.log(`Chapter 2 finite paths  : Total ${this.stats.ch2Paths.total} (Pass: ${this.stats.ch2Paths.pass}, Fail-soft: ${this.stats.ch2Paths.failSoft}, Invalid: ${this.stats.ch2Paths.invalid})`);

    if (this.warnings.length > 0) {
      this.log(`\n[WARNINGS] (${this.warnings.length} peringatan):`);
      this.warnings.sort().forEach((w) => this.log(`  ${w}`));
    }

    if (this.errors.length > 0) {
      this.log(`\n[ERRORS] (${this.errors.length} kesalahan terdeteksi):`);
      this.errors.sort().forEach((e) => this.log(`  ${e}`));
      this.log('\n[STATUS] VALIDATION FAILED (Exit code 1)');
      return false;
    } else {
      this.log('\n[STATUS] ALL CHECKS PASSED: Konten executable, konsisten secara matematis, dan memenuhi kontrak PRD canonical.');
      return true;
    }
  }
}

// Direct execution CLI entrypoint
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const validator = new ContentValidator();
  const success = validator.run();
  process.exit(success ? 0 : 1);
}
