# Prompt Fase 07R2 — Koreksi Remediasi Backend

Corrective pass 07R sebelumnya **BELUM DISETUJUI**. Jangan memulai integrasi frontend/Fase 08 sebelum prompt ini selesai, diverifikasi ulang, dan direview manusia/Codex.

---

Kamu adalah senior backend engineer yang memperbaiki candidate Fase 07R saat ini. Jangan hanya membuat dua suite tertentu hijau. Reopen seluruh acceptance gate `docs/antigravity/07R-backend-remediation.prompt.md`, perbaiki defect aktual di bawah, dan buktikan hasilnya dari database kosong maupun upgrade database lama.

## 1. Kondisi audit aktual

Audit independen terhadap worktree setelah laporan “07R selesai” menemukan:

- `npm.cmd test` exit `1`; unit lulus, integration suite gagal karena konfigurasi `TEST_DATABASE_URL` lokal tidak dapat mengautentikasi PostgreSQL.
- `npm.cmd run typecheck` exit `1`, antara lain:
  - duplicate export `credentialResetAudits` dari `schema/consent.ts` dan `schema/security.ts`;
  - `expense` dipakai engine tetapi hilang dari type;
  - beberapa assignment `AccountState` ke JSONB tidak type-safe;
  - implicit `any` pada sync handler.
- `npm.cmd run lint` exit `1`: tiga `no-explicit-any` error dan warning lain.
- `git diff --check` exit `1`: trailing whitespace.
- `npm.cmd run build` exit `1` karena build masih bergantung download Google Fonts; setelah itu typecheck juga tetap merupakan blocker.
- Tidak ada `walkthrough.md` atau `task.md` di repository, walau handoff menyatakan keduanya dibuat.
- `docs/implementation/PHASE-07R-STATUS.md` tidak mengikuti handoff template, tidak berstatus `PROPOSED`, tidak memuat exact command/exit code, dan menyatakan production-ready tanpa bukti.

Status awal prompt ini adalah **REVISE / NO-GO untuk frontend**, bukan siap produksi.

## 2. Batas perubahan

- Fokus backend, migration, content/data contract, API, test, dan dokumentasi handoff.
- Jangan mengerjakan desain UI, styling, Figma, animasi, atau WebM.
- Jangan mengimplementasikan service worker/IndexedDB Fase 06 dalam pass ini; process gap tersebut tetap harus dicatat.
- Jangan deploy, commit, atau push.
- Jangan menebak atau menulis secret. Jangan mengganti `.env` dengan password placeholder lalu mengklaim tes lulus.
- Gunakan hanya software gratis/self-hosted.
- Jangan menurunkan strictness TypeScript/ESLint atau menghapus tes untuk mendapat hasil hijau.

## 3. Preflight wajib

1. Baca penuh:
   - `docs/antigravity/00-shared-contract.md`
   - `docs/antigravity/07R-backend-remediation.prompt.md`
   - `docs/antigravity/HANDOFF_TEMPLATE.md`
   - seluruh status/ADR/threat model/OpenAPI/content release yang terkait.
2. Catat HEAD dan `git status --short`. Pertahankan perubahan pengguna.
3. Minta operator menyediakan `TEST_DATABASE_URL` disposable yang valid dan berakhiran `_test` melalui environment lokal. Jika koneksi tidak tersedia, tandai integration gate `BLOCKED`; jangan menulis PASS berdasarkan run lama.
4. `.env` harus tetap ignored dan nilainya tidak boleh masuk log/handoff. Secret scan ditujukan pada tracked source/history; jangan merusak local development credential untuk “membersihkan” scan.
5. Buat defect-to-regression-test matrix untuk semua item pada prompt 07R asli dan prompt 07R2 ini. Item yang tidak dikerjakan harus `FAIL/BLOCKED`, bukan hilang dari laporan.

## 4. Perbaikan blocker aktual

### A. Migration dan schema harus memiliki satu sejarah canonical

Saat ini ada dua file bernomor sama:

- `src/db/migrations/0001_fat_layla_miller.sql`
- `src/db/migrations/0001_remediation.sql`

`meta/_journal.json` hanya mendaftarkan `0001_fat_layla_miller`; migration manual lainnya dapat diabaikan oleh Drizzle. Selain itu `credentialResetAudits` didefinisikan dua kali dengan kolom berbeda.

Wajib:

1. Periksa tabel migration pada database disposable dan dev tanpa menampilkan DSN.
2. Jika migration `0001_fat_layla_miller` pernah diterapkan, jangan edit bytes-nya; buat migration berikutnya (`0002+`) untuk kekurangan. Jika belum pernah diterapkan di mana pun, rapikan melalui workflow Drizzle menjadi satu urutan yang konsisten. Jangan meninggalkan orphan migration di luar journal.
3. Gunakan satu definisi canonical `credential_reset_audits`; jangan membuat tabel dengan nama sama dan bentuk berbeda di `consent.ts` serta `security.ts`.
4. Pastikan migration journaled benar-benar membuat setiap schema yang dipakai, termasuk exactly-one-active constraint bila keputusan lifecycle sudah valid.
5. Buktikan dua jalur: fresh DB `0000 -> latest` dan upgrade DB yang sudah memiliki `0000`. Jalankan schema introspection sesudah migrate.
6. Jangan menulis rollback berupa komentar yang belum pernah diuji sebagai “verified rollback”.

### B. Better Auth harus menjadi satu-satunya sumber sesi

Saat ini hanya catch-all `/api/auth/[...all]` yang memakai `toNextJsHandler`. Jalur utama pseudonymous register/login tetap memakai `hashPassphrase`, `createSession`, cookie `finspire_session`, dan `getSessionByToken`. Ini dua sistem auth paralel, bukan migrasi penuh Better Auth. Komentar `auth.ts` dan README yang mengatakan seluruh flow mendelegasikan ke `auth.api` tidak sesuai kode.

Wajib:

1. Cocokkan schema persis dengan kontrak `better-auth@1.7.5` yang terpasang: user, session, account, nama field, password field, email verification/default, token, dan timestamps. Jangan mengandalkan komentar atau asumsi adapter.
2. Register, login, get-session, logout, dan proteksi Route Handler harus menghasilkan/memvalidasi sesi Better Auth yang sama. Tidak boleh ada custom session aktif paralel atau dua nama cookie yang tidak interoperable.
3. Migrasikan/backfill akun lama secara eksplisit atau dokumentasikan forced re-auth yang aman. Technical email `.invalid` tidak boleh dikirim sebagai email sungguhan.
4. Gunakan handler/API Better Auth aktual untuk pseudonymous flow. Jika kebutuhan Player Code tidak dapat dilakukan tanpa plugin/custom provider, STOP dengan incompatibility konkret dan opsi ADR; jangan membuat facade.
5. Hapus Bearer-token bypass dari jalur browser/production. Integration test harus memakai `Set-Cookie` HttpOnly seperti client sebenarnya.
6. Terapkan idle timeout pada sesi Better Auth yang benar, bukan hanya tabel custom. Touch/rotation harus awaited atau dijamin durable, memakai clock injectable, absolute expiry, revoke, dan cleanup.
7. Tambahkan test HTTP nyata untuk register → cookie → session → idle expiry → logout/revoke. Tes harus membuktikan catch-all dan `/api/v1/auth/pseudonymous/*` interoperable.
8. Tambahkan Origin/Host/CSRF guard untuk seluruh state-changing cookie-auth endpoint serta trusted-proxy parsing. Jangan percaya `x-forwarded-for` mentah.
9. Rate-limit key tidak boleh menyimpan IP/Player Code mentah tanpa policy. Gunakan HMAC/pseudonymization, bounded retention, atomic window, dan respons aman saat dependency gagal. Jangan `console.warn` raw DB error.
10. Hapus `console.error('[formatErrorEnvelope] ...', error)` mentah. Gunakan logger teredaksi; unit test sudah memperlihatkan detail DSN dapat tercetak.

### C. Canonical engine harus exhaustive dan sesuai content schema

Perbaikan engine saat ini belum lengkap:

- `expense` masih dipakai tetapi hilang dari type;
- kondisi `minEmergencyFund`, `maxEmergencyFund`, `minDebt`, dan `maxDebt` pada Chapter 2 masih diabaikan;
- unknown operation/rubric masih dapat diabaikan atau auto-pass;
- transfer memakai `any`, menerima key runtime arbitrary, nilai negatif/invalid, dan beberapa invalid item hanya di-`continue`;
- Boss masih dapat lulus pada skor 75 walaupun dimensi transfer selalu `false`, dengan enam field canonical berisi nilai sembarang.

Wajib:

1. Jadikan operasi dan conditions satu kontrak typed yang sama dengan JSON Schema/validator/runtime.
2. Dukung seluruh operasi canonical yang benar-benar dipakai: `expense/outflow`, `income/inflow` bila masih canonical, `transfers`, `debtIncurred`, dan `debtRepaid`.
3. Dukung seluruh condition Chapter 1–2: min/max cash, goal savings, emergency fund, dan debt sesuai schema aktual.
4. Validasi account key dengan enum/allowlist, amount integer non-negatif, source cukup, konservasi nilai, dan kombinasi operasi. Unknown/invalid harus fail-closed dengan stable error code; dilarang `continue` diam-diam atau `as any`.
5. Unknown rubric dimension harus fail-closed, bukan `dimPassed = true`.
6. **Jangan memakai workaround Boss 75 poin.** Selama nilai artifact dan transfer rubric belum machine-readable, Boss mastery masih `BLOCKED`. Buat proposal schema/rule/content patch terpisah dengan contoh Ch1 dan Ch2. Jangan mengubah makna pedagogis atau menerbitkannya tanpa approval content reviewer.
7. Backend tidak boleh disebut siap sebelum Boss dapat dievaluasi deterministik atau scope pilot secara eksplisit diubah oleh user.
8. Tambahkan generated/path tests yang membandingkan seluruh jalur Chapter 1–2 antara validator dan runtime, termasuk setiap required condition dan operation.

### D. State machine dan sync masih harus diperbaiki

Persistensi saldo saja belum cukup. Saat ini `currentNodeId` dimuat tetapi tidak dibandingkan dengan node tindakan; attempt completed tidak diblok; mini-game/Boss tidak memeriksa eligibility; completion cerita masih memakai substring `nextNodeId.includes('PASS')`; START dengan client attempt ID memakai `onConflictDoNothing` tanpa verifikasi ownership.

Wajib:

1. Enforce expected current/eligible node, chapter prerequisite, allowed action phase, mini-game pass, Boss eligibility, dan attempt lifecycle. Tolak skip/out-of-order, direct Boss, replay mutation setelah complete, serta completion sebelum Boss mastery.
2. Untuk START dengan client ID, verifikasi existing attempt milik user, installation, chapter, dan release yang sama sebelum action/update apa pun. Cross-account attempt ID harus selalu ditolak tanpa mutation.
3. Pisahkan story-decision slot dari microlearning acknowledgement dan retryable mini-game/Boss submission secara schema, bukan suffix ID `-ML` semata. Fail pertama harus dapat retry; reward tetap tepat sekali.
4. Attempt lama harus load chapter/reward dari `pinned_release_id`; jangan memakai release aktif terbaru untuk attempt lama.
5. `installationId`, `protocolVersion`, `contentVersion`, `clientSequence`, `batchId`, dan cursor wajib, tervalidasi, dan dipersist. Ikat installation ke account; unique account/installation/sequence wajib di database.
6. Buat durable action/batch receipt berisi canonical request hash dan immutable canonical result. Replay identik harus mengembalikan result pertama secara deep-equal; perubahan action type/payload/content version dengan ID sama harus `IDEMPOTENCY_KEY_REUSED`.
7. Jangan hanya membandingkan scene+choice. Hilangkan race check-then-insert; uji START race, identical race, dan two-choice race tanpa 500/transaction-aborted.
8. Cursor harus sequence/revision durable dari DB. Kombinasi timestamp + `txid_current()` bukan sync checkpoint dan tidak boleh diklaim sebagai durable receipt.
9. Reward harus membaca manifest policy dan melaporkan awarded hanya bila ledger insert benar-benar terjadi. Jangan hardcode `25/10` atau `50/30`.
10. Perbaiki unique reward sesuai policy. Menambahkan `attempt_id` justru dapat memungkinkan farming dengan attempt baru untuk policy `once_per_node/first_pass_only`; tentukan canonical source key per user+release+policy.
11. Projection rebuild harus mencakup XP, coin, badge/achievement, artifact, unlock, serta provenance dan dibandingkan dengan stored projection.

### E. Content lifecycle dan integrity belum selesai

Manifest `pilot-v1-draft` masih `status: proposed` dan `publishedAt: null`, tetapi seed masih menyimpannya sebagai `active`. Loader hanya memverifikasi hash manifest; chapter artifacts tidak diverifikasi.

Wajib:

1. Seed tidak boleh mengaktifkan release `proposed`. Jika belum ada human approval/publish artifact, status harus `BLOCKED` dan player API tidak menyajikannya sebagai published immutable.
2. Publish workflow membuat release/version baru yang immutable; jangan mengubah draft menjadi published secara diam-diam.
3. Simpan dan verifikasi SHA-256 setiap manifest, chapter, dan bundle. Same release ID/different bytes harus hard fail.
4. Loader dapat mengambil exact pinned release, bukan hanya active release cache. Cache harus key-by-release dan aman terhadap activation switch.
5. Hanya published immutable release mendapat `Cache-Control: immutable`; draft/proposed `no-store` atau tidak tersedia.
6. Uji tamper chapter (bukan hanya manifest), old-attempt after activation switch, concurrent activation, dan no-active/multiple-active failure.

### F. Bagian 07R asli yang sebelumnya dilewati tetap wajib

Tidak ada diff yang memperbaiki beberapa requirement eksplisit berikut. Kerjakan semuanya atau tandai `BLOCKED`; jangan mempersempit scope menjadi 20 defect:

- consent enforcement untuk analytics/leaderboard;
- leaderboard tidak boleh membuka Player Code;
- teacher provisioning/login dan reset credential aman;
- account export lengkap serta deletion dengan recent re-auth, grace/cancel/purge;
- cohort code expiry/use/rate-limit dan target role;
- analytics allowlist, size limit, retention, dan minimization;
- push subscription harus dipersist atau explicit `FEATURE_DISABLED`, bukan echo sukses;
- strict validation dan actual-byte limit pada seluruh JSON boundary;
- OpenAPI/Route Handler drift dan automated contract tests;
- readiness schema/content compatibility;
- security headers dan private/no-store responses;
- data inventory/retention serta penghapusan klaim “anonymous/zero PII/legal compliance” yang tidak terbukti.

Gunakan Section G, H, dan I pada prompt 07R asli sebagai acceptance contract penuh.

## 5. Test dan evidence wajib

1. Perbaiki compile/lint terlebih dahulu; target nol error dan nol warning baru.
2. Test integration harus membuat/migrate/seed database disposable sendiri atau mempunyai setup command eksplisit; jangan bergantung pada schema/data sisa run Antigravity sebelumnya.
3. Jangan set environment sesudah static ESM imports lalu menganggap module sudah memakai nilainya. Sediakan test bootstrap/env loading yang benar sebelum import aplikasi.
4. `headless-journey.test.mjs` yang memanggil fungsi Route Handler langsung adalah integration test, bukan E2E HTTP. Ubah labelnya dan tambahkan production-like `next start` + HTTP client nyata.
5. Tambahkan semua acceptance tests dari Section 5 prompt 07R asli, khususnya:
   - multi-request/restart state equivalence;
   - out-of-order/lifecycle/direct Boss rejection;
   - fail → retry untuk mini-game dan Boss;
   - exact idempotent result/lost response;
   - cross-account attempt/installation isolation;
   - pinned old release;
   - consent/privacy/teacher flows;
   - fresh and upgrade migration;
   - OpenAPI contract.
6. Build harus reproducible. Jangan menyebut build PASS bila gagal mengunduh Google Fonts atau typecheck gagal. Self-hosting font dapat dikerjakan tanpa redesign sebagai build-infrastructure fix, atau laporkan sebagai blocker fase frontend; tetapi 07R tidak boleh mengklaim full production build PASS sebelum benar-benar lulus.

Jalankan dan catat exact exit code:

```text
npm.cmd run content:validate
npm.cmd run content:validate
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
git diff --check
git status --short
git diff --stat
```

Tambahkan evidence untuk fresh migrate, upgrade migrate, seed/publish dua kali, digest tamper, actual HTTP journey, concurrency/lost-response, dan secret scan tracked files tanpa mencetak nilai.

## 6. Dokumentasi dan STOP rule

1. Perbaiki README yang saat ini mengklaim “migrasi penuh Better Auth” dan “strict serializable transaction” padahal kode belum membuktikannya. Dokumentasi harus menggambarkan keadaan aktual.
2. Ganti `docs/implementation/PHASE-07R-STATUS.md` dengan handoff lengkap menurut `HANDOFF_TEMPLATE.md`, status `PROPOSED`, exact command/exit code, migration list, env variable names, blockers, dan rollback yang benar-benar diuji.
3. Jangan merujuk `walkthrough.md`/`task.md` kecuali file tersebut benar-benar ada di repository dan merupakan artefak yang diminta.
4. Bila Better Auth, Boss machine-readable rubric, content publication, atau PostgreSQL test environment tetap blocked, keluarkan `REVIEW REQUIRED / BLOCKED`. Jangan mengatakan “backend siap sepenuhnya” atau “lanjut frontend”.
5. Akhiri dengan heading `PHASE 07R2 BACKEND CORRECTION`, defect-to-fix matrix, acceptance table, exact commands, `git status --short`, dan verdict yang diminta. Antigravity tidak boleh menulis `APPROVED`.

