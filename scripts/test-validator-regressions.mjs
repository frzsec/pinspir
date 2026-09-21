import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { ContentValidator } from './validate-content.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const ORIGINAL_CONTENT_DIR = path.join(REPO_ROOT, 'content');
const ORIGINAL_DOCS_DIR = path.join(REPO_ROOT, 'docs', 'content');

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createFixtureSandbox() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finspire-reg-'));
  const contentDest = path.join(tempDir, 'content');
  const docsDest = path.join(tempDir, 'docs', 'content');

  copyDirRecursive(ORIGINAL_CONTENT_DIR, contentDest);
  copyDirRecursive(ORIGINAL_DOCS_DIR, docsDest);

  return {
    tempDir,
    contentDir: contentDest,
    releasesDir: path.join(contentDest, 'releases'),
    schemaFile: path.join(contentDest, 'schema', 'content-release.schema.json'),
    decisionsFile: path.join(docsDest, 'OPEN_DECISIONS.md'),
    cleanup: () => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  };
}

const testCases = [
  {
    name: '1. Required field hilang (title pada manifest dihapus)',
    mutate: (sandbox) => {
      const manifestPath = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      delete manifest.title;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    },
    expectedErrorSubstring: "Field wajib 'title' tidak ditemukan"
  },
  {
    name: '2. Tipe salah (availableCash berupa string)',
    mutate: (sandbox) => {
      const ch1Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-01.json');
      const ch1 = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
      ch1.initialAccounts.availableCash = "sepuluh-ribu";
      fs.writeFileSync(ch1Path, JSON.stringify(ch1, null, 2));
    },
    expectedErrorSubstring: "Tipe data salah"
  },
  {
    name: '3. Dangling node (nextNodeId menunjuk simpul fiktif)',
    mutate: (sandbox) => {
      const ch1Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-01.json');
      const ch1 = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
      ch1.scenes[0].choices[0].nextNodeId = "CH1-GHOST-NODE";
      fs.writeFileSync(ch1Path, JSON.stringify(ch1, null, 2));
    },
    expectedErrorSubstring: "dangling pointer"
  },
  {
    name: '4. Saldo negatif di Chapter 1 (pengeluaran melampaui kas)',
    mutate: (sandbox) => {
      const ch1Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-01.json');
      const ch1 = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
      ch1.scenes[0].choices[0].deltaSimulatedMoney = -50000;
      delete ch1.scenes[0].choices[0].requiredConditions;
      fs.writeFileSync(ch1Path, JSON.stringify(ch1, null, 2));
    },
    expectedErrorSubstring: "saldo negatif"
  },
  {
    name: '5. Alokasi melebihi saldo kas (transfer Rp115.000 dari saldo Rp100.000)',
    mutate: (sandbox) => {
      const ch2Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-02.json');
      const ch2 = JSON.parse(fs.readFileSync(ch2Path, 'utf-8'));
      ch2.scenes[0].choices[0].stateOperations = {
        inflow: 100000,
        transfer: {
          from: "availableCash",
          to: "goalSavings",
          amount: 115000
        }
      };
      fs.writeFileSync(ch2Path, JSON.stringify(ch2, null, 2));
    },
    expectedErrorSubstring: "Transfer gagal: saldo 'availableCash'"
  },
  {
    name: '6. Inflow ganda bulanan (dua kali inflow dalam bulan 1 melebihi plafon Rp300.000)',
    mutate: (sandbox) => {
      const ch2Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-02.json');
      const ch2 = JSON.parse(fs.readFileSync(ch2Path, 'utf-8'));
      // Inflow added on shock scene CH2-SC-02
      ch2.scenes[1].choices[0].stateOperations.inflow = 100000;
      fs.writeFileSync(ch2Path, JSON.stringify(ch2, null, 2));
    },
    expectedErrorSubstring: "Inflow tidak sah pada simpul 'CH2-SC-02'"
  },
  {
    name: '7. Operasi transfer tidak sah (sumber dan tujuan sama atau transfer negatif)',
    mutate: (sandbox) => {
      const ch2Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-02.json');
      const ch2 = JSON.parse(fs.readFileSync(ch2Path, 'utf-8'));
      ch2.scenes[0].choices[0].stateOperations.transfers.push({
        from: "availableCash",
        to: "availableCash",
        amount: 10000
      });
      fs.writeFileSync(ch2Path, JSON.stringify(ch2, null, 2));
    },
    expectedErrorSubstring: "Transfer tidak sah"
  },
  {
    name: '8. Decision ID SUPERSEDED masih direferensikan (DEC-CH2-MATH)',
    mutate: (sandbox) => {
      const ch2Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-02.json');
      const ch2 = JSON.parse(fs.readFileSync(ch2Path, 'utf-8'));
      ch2.scenes[0].assumptionRef = "DEC-CH2-MATH";
      fs.writeFileSync(ch2Path, JSON.stringify(ch2, null, 2));
    },
    expectedErrorSubstring: "Scene mereferensikan decision ID yang telah SUPERSEDED: 'DEC-CH2-MATH'"
  },
  {
    name: '9. Boss challenge tidak memiliki masteryArtifact',
    mutate: (sandbox) => {
      const ch1Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-01.json');
      const ch1 = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
      delete ch1.bossChallenge.masteryArtifact;
      fs.writeFileSync(ch1Path, JSON.stringify(ch1, null, 2));
    },
    expectedErrorSubstring: "Field wajib 'masteryArtifact' tidak ditemukan"
  },
  {
    name: '10. Bobot evaluationRubric di luar batas (weight 999 atau sum != 100)',
    mutate: (sandbox) => {
      const ch1Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-01.json');
      const ch1 = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
      ch1.bossChallenge.evaluationRubric[0].weight = 999;
      fs.writeFileSync(ch1Path, JSON.stringify(ch1, null, 2));
    },
    expectedErrorSubstring: "lebih dari maximum 100"
  },
  {
    name: '11. Properti ilegal disisipkan pada scene (enforce additionalProperties: false)',
    mutate: (sandbox) => {
      const ch1Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-01.json');
      const ch1 = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
      ch1.scenes[0].illegalProperty = "injected_hack";
      fs.writeFileSync(ch1Path, JSON.stringify(ch1, null, 2));
    },
    expectedErrorSubstring: "Property 'illegalProperty' tidak diizinkan (additionalProperties: false)"
  },
  {
    name: '12. Consumed outcome tag belum pernah diproduksi oleh chapter sebelumnya',
    mutate: (sandbox) => {
      const ch2Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-02.json');
      const ch2 = JSON.parse(fs.readFileSync(ch2Path, 'utf-8'));
      ch2.scenes[0].consumedPreconditions = ["OUTCOME_GHOST_REQUIREMENT"];
      fs.writeFileSync(ch2Path, JSON.stringify(ch2, null, 2));
    },
    expectedErrorSubstring: "consumedPreconditions 'OUTCOME_GHOST_REQUIREMENT' belum pernah diproduksi"
  },
  {
    name: '13. Jalur Pass Chapter 2 berakhir dengan utang belum lunas',
    mutate: (sandbox) => {
      const ch2Path = path.join(sandbox.releasesDir, 'pilot-v1-draft', 'chapter-02.json');
      const ch2 = JSON.parse(fs.readFileSync(ch2Path, 'utf-8'));
      // Remove maxDebt and minEmergencyFund requirements from pass choice, allowing debt path to reach pass
      delete ch2.scenes[5].choices[0].requiredConditions.maxDebt;
      delete ch2.scenes[5].choices[0].requiredConditions.minEmergencyFund;
      fs.writeFileSync(ch2Path, JSON.stringify(ch2, null, 2));
    },
    expectedErrorSubstring: "Jalur Pass Chapter 2 berakhir dengan utang belum lunas"
  }
];

function runRegressionSuite() {
  console.log('=== Menjalankan Finspire Content Validator Regression Test Suite ===\n');
  let passedCount = 0;
  let failedCount = 0;

  for (const testCase of testCases) {
    const sandbox = createFixtureSandbox();
    try {
      testCase.mutate(sandbox);

      const validator = new ContentValidator({
        repoRoot: sandbox.tempDir,
        contentDir: sandbox.contentDir,
        releasesDir: sandbox.releasesDir,
        schemaFile: sandbox.schemaFile,
        decisionsFile: sandbox.decisionsFile,
        silent: true
      });

      const success = validator.run();
      const hasExpectedError = validator.errors.some((e) =>
        e.toLowerCase().includes(testCase.expectedErrorSubstring.toLowerCase())
      );

      if (!success && hasExpectedError) {
        console.log(`[PASS] ${testCase.name}`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${testCase.name}`);
        console.error(`       Validator returned success=${success}, expected error containing '${testCase.expectedErrorSubstring}'`);
        console.error(`       Actual errors:`, validator.errors);
        failedCount++;
      }
    } catch (err) {
      console.error(`[ERROR] Eksepsi tidak terduga pada '${testCase.name}':`, err);
      failedCount++;
    } finally {
      sandbox.cleanup();
    }
  }

  console.log(`\n--- Ringkasan Hasil Regression Test ---`);
  console.log(`Total tes : ${testCases.length}`);
  console.log(`Passed    : ${passedCount}`);
  console.log(`Failed    : ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n[STATUS] REGRESSION SUITE FAILED (Exit code 1)');
    process.exit(1);
  } else {
    console.log('\n[STATUS] ALL REGRESSION TESTS PASSED (13/13 verified against fault models).');
    process.exit(0);
  }
}

runRegressionSuite();
