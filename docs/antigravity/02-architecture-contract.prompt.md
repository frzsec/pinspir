# Prompt Fase 02 — Architecture Contract

Salin isi prompt ini ke Antigravity hanya setelah Fase 01 disetujui.

---

Kamu bekerja di repository `finspire`. Rancang kontrak arsitektur production pilot offline-first berdasarkan konten yang **sudah disetujui**. Fase ini dokumentasi/contract-first; jangan mengimplementasikan runtime, memasang dependency, atau mengubah UI.

## Preflight wajib

1. Baca penuh:
   - `docs/antigravity/00-shared-contract.md`;
   - semua `docs/content/*`;
   - `content/schema/*` dan release pilot;
   - `AGENTS.md`, `package.json`, `package-lock.json`, `next.config.ts`, dan struktur `src/`;
   - sumber proyek yang dirujuk content evidence bila diperlukan.
2. Pastikan `docs/content/STATUS.md` berstatus `APPROVED` oleh reviewer dan tidak ada `BLOCKING` decision terbuka.
3. Jalankan validator konten dan catat content version/hash sebagai input arsitektur.
4. Jalankan `git status --short` dan identifikasi perubahan yang sudah ada.

Jika approval konten belum ada atau satu hitungan canonical masih ambigu, STOP. Jangan merancang database berdasarkan tebakan.

## Tujuan fase

Hasil harus cukup presisi agar agent implementasi tidak perlu menciptakan semantics sendiri. Semua requirement utama harus ditautkan ke data owner, API, invariant, threat/control, dan test.

## Artefak wajib di `docs/architecture/`

### 1. `SYSTEM_ARCHITECTURE.md`

Dokumentasikan:

- context/container/component diagram dalam Mermaid;
- browser/PWA, service worker, IndexedDB, Next.js Route Handlers, Better Auth, domain engine, Drizzle, PostgreSQL, job/maintenance path, Nginx/PM2, dan backup boundary;
- online flow, first-login/content-pack flow, offline play, reconnect sync, teacher flow, dan deployment flow;
- trust boundary dan source of truth tiap state;
- batas single-VPS pilot, failure modes, degraded behavior, dan future scaling seams;
- keputusan UI final/aset WebM berada di luar fase backend.

### 2. `DATA_MODEL.md`

Buat ERD Mermaid dan data dictionary dengan PK/FK, unique constraints, index, retention, owner, dan mutability. Model minimal harus membahas:

- tabel Better Auth yang kompatibel dengan strategi terpilih;
- `player_profiles`, `schools`, `cohorts`, membership/enrollment, invitation/access code, role/permission;
- consent/assent record dan credential reset audit;
- `installations` tanpa menyimpan secret client;
- content release, chapter, node/scene, choice, assessment/rubric, asset manifest;
- playthrough/attempt, accepted action/event, decision, answer/result;
- append-only reward ledger dan rebuildable player projection;
- achievements, unlocks, streak dates/claims;
- sync batch/action receipt, per-installation sequence, server cursor;
- push subscription dengan lifecycle aman;
- first-party analytics event yang minimal dan pseudonim;
- audit log untuk tindakan teacher/admin.

Jangan membuat kolom `chapter1Done`, `chapter2Done`, dan seterusnya. Gunakan relasi/versioned state yang dapat berkembang. Tentukan unique constraint konkret untuk idempotency dan reward-once.

### 3. `API_CONTRACT.md` dan `openapi.v1.json`

Definisikan REST/JSON Route Handlers `/api/v1` beserta auth, request/response, status code, rate/size limit, pagination, correlation ID, dan error envelope. OpenAPI harus valid JSON agar dapat diparse tanpa package tambahan.

Minimal kontrak untuk:

- liveness/readiness;
- bootstrap/session/player profile;
- content catalog, immutable pack/manifest, dan pack integrity metadata;
- playthrough/attempt start dan canonical snapshot;
- batch sync sebagai jalur utama mutasi gameplay;
- progress/achievement/unlock;
- leaderboard opt-in dan scope cohort;
- school/cohort/access-code serta teacher summary;
- consent status, data export, dan account deletion;
- push subscribe/unsubscribe;
- first-party analytics ingestion yang allowlisted.

Tentukan mana yang tidak tersedia offline dan jangan memasukkan API privat ke cache strategy.

### 4. `OFFLINE_SYNC_PROTOCOL.md`

Spesifikasikan state machine dan contoh JSON lengkap untuk request/response. Request minimal memuat:

- `protocolVersion`, `batchId`, `installationId`, `lastServerCursor`;
- ordered action berisi `actionId` UUID, sequence, type, attempt/playthrough ID, content release/version, occurredAt metadata, dan payload mentah.

Response minimal memuat:

- result per action: `accepted`, `duplicate`, `conflict`, atau `rejected`;
- stable result/error code dan apakah retryable;
- canonical calculated consequence/reward;
- `nextServerCursor`, canonical projection/snapshot atau patch yang versioned;
- content invalidation/update notice dan server time.

Tetapkan secara eksplisit:

- transaction boundary dan lock/concurrency strategy;
- identical retry dan changed-payload duplicate;
- first-accepted decision wins;
- out-of-order sequence, partial batch failure, timeout-after-commit, stale content version;
- multi-tab, multi-device, expired session, account switch, explicit logout;
- compaction/acknowledgement outbox tanpa kehilangan aksi;
- client clock tidak menentukan streak/reward canonical;
- batas batch, exponential backoff + jitter, dan dead-letter/user-recovery state.

### 5. `CONTENT_RELEASE_PROTOCOL.md`

Jelaskan immutable publish, semantic/internal version, schema compatibility, SHA-256 manifest, atomic activation, rollback ke release lama tanpa mengubah history, cache invalidation, migration rules, dan kapan draft boleh diseed. Bedakan asset logical key dari URL hashed/CDN path. WebM transparan harus punya poster/fallback dan metadata reduced-motion; aset final belum dibuat.

### 6. `SECURITY_PRIVACY_THREAT_MODEL.md`

Gunakan threat table (asset, actor, abuse case, impact, control, verification) minimal untuk:

- credential/access-code brute force dan enumeration;
- session theft/fixation/CSRF/XSS;
- broken object-level authorization teacher/cohort;
- replay/tamper offline action dan reward farming;
- shared school device/account switch/local data exposure;
- malicious/oversized sync batch dan DoS;
- content pack tamper/stale rules;
- log/analytics/backup leakage;
- deletion/export abuse;
- service worker cache poisoning/update failure.

Dokumentasikan data inventory, purpose, minimization, retention proposal, deletion/anonymization behavior, consent boundaries, log redaction, dan hal yang masih memerlukan legal/operational review. Jangan menyatakan compliance sebagai fakta.

### 7. `TEST_STRATEGY.md`

Buat test pyramid dan requirement-to-test matrix untuk unit, PostgreSQL integration, API contract, browser E2E, offline/service-worker, security negative tests, migration, backup/restore, dan load baseline. Tetapkan deterministic clock/UUID/random injection, fixture strategy, fresh DB policy, serta browser/device matrix realistis untuk sekolah.

### 8. `IMPLEMENTATION_PLAN.md`

Pecah sesuai Fase 03–09 paket Antigravity. Untuk setiap fase tulis dependency, file boundary, data migration, exit criteria, rollback, dan risiko. Jangan mengubah urutan gate.

### 9. `REQUIREMENTS_TRACEABILITY.md`

Setiap requirement berkode (`CNT`, `AUTH`, `GAME`, `OFF`, `SCH`, `OPS`, `PRIV`) harus memetakan:

- sumber/decision ID;
- owner/source of truth;
- tabel/data;
- endpoint atau internal component;
- invariant;
- test ID;
- fase implementasi.

Requirement tanpa test atau owner adalah gap dan harus ditandai.

### 10. ADR di `docs/architecture/adr/`

Buat minimal:

- `ADR-001-runtime-and-module-boundaries.md`;
- `ADR-002-pseudonymous-auth-and-recovery.md`;
- `ADR-003-event-ledger-and-projections.md`;
- `ADR-004-offline-outbox-sync-and-conflicts.md`;
- `ADR-005-content-versioning-and-assets.md`;
- `ADR-006-single-vps-operations.md`.

Setiap ADR berisi context, decision, alternatives, consequences, security/privacy impact, migration/rollback, dan evidence.

Untuk ADR auth, evaluasi minimal:

1. durable Player Code + passphrase di atas Better Auth dengan identifier internal non-PII (misalnya technical alias domain reserved `.invalid` bila benar-benar didukung dan teruji);
2. anonymous-first lalu linking ke durable credential;
3. custom credential provider.

Rekomendasi default adalah durable pseudonymous account tanpa email/telepon asli, tetapi **verifikasi terhadap dokumentasi resmi Better Auth versi yang akan dipasang**. Jangan mengarang API, jangan mencampur dua model, dan tulis keterbatasan recovery tanpa email. Jika tidak ada opsi Better Auth yang aman/maintainable, jadikan keputusan blocking sebelum coding.

### 11. `STATUS.md`

Set status `PROPOSED`, daftar seluruh ADR, blocking issue, dan checklist reviewer. Hanya reviewer manusia yang boleh mengubah ke `APPROVED`.

## Quality constraints

- Tetap kompatibel dengan Next.js/React aktual. Untuk perilaku framework, gunakan dokumentasi lokal sesuai `AGENTS.md`; gunakan dokumentasi resmi terbaru untuk Better Auth/Drizzle/Serwist bila butuh verifikasi.
- Tidak boleh bergantung pada SaaS berbayar atau selalu-online client.
- Hindari “last write wins” untuk keputusan gameplay/reward.
- Jangan memakai client-submitted delta/score sebagai canonical.
- Jangan menjadikan Background Sync satu-satunya trigger.
- Jangan cache response auth/API privat.
- Jangan menjanjikan exact capacity sebelum load test.
- Jangan memasukkan SQL, endpoint, atau fitur hanya sebagai nama; jelaskan constraint dan semantics yang diperlukan implementer.

## Verifikasi wajib

1. Parse `openapi.v1.json` dengan Node built-in.
2. Jalankan validator konten dari Fase 01.
3. Audit seluruh internal link, requirement ID, test ID, table/entity, endpoint, dan ADR reference.
4. Pastikan semua invariant di shared contract muncul di architecture/test mapping.
5. Cari kontradiksi: naming, version field, auth model, conflict status, reward semantics, timezone, dan content lifecycle.
6. Pastikan hanya dokumentasi arsitektur yang berubah.
7. Jalankan `npm run lint` dan `npm run build` untuk memastikan contract/script tidak merusak baseline.
8. Jalankan `git diff --check`, `git status --short`, dan `git diff --stat`.

## Acceptance gate

Mintalah review hanya jika:

- tidak ada keputusan blocking yang diam-diam dipilih;
- setiap data canonical mempunyai satu owner;
- ERD menyediakan unique constraints/transaction path untuk invariant penting;
- OpenAPI dan sync examples konsisten;
- auth/recovery untuk pengguna pseudonim dapat diimplementasikan tanpa PII wajib/layanan berbayar;
- offline failure modes dan privacy di perangkat bersama terdefinisi;
- requirement utama dapat ditelusuri ke tes;
- status tetap `PROPOSED`.

Jika ada unresolved auth/content/security decision, tulis opsi serta rekomendasi lalu STOP. Jangan membuat migration atau memasang dependency.

## Handoff

Gunakan `docs/antigravity/HANDOFF_TEMPLATE.md`. Tambahkan ringkasan data flow online/offline, daftar ADR dengan status, daftar blocking decision, dan top-10 test yang menjadi gate implementasi. Akhiri setelah handoff; jangan menjalankan Fase 03.

---
