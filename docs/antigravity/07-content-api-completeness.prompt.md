# Prompt Fase 07 — Content Release dan API Pilot Lengkap

Jalankan hanya setelah Fase 06 disetujui.

---

Kamu bekerja di repository `finspire`. Selesaikan backend production pilot Chapter 1–2 dan capability sekolah yang disetujui, lalu buktikan seluruh journey melalui headless client. Jangan mengerjakan desain visual.

## Preflight wajib

1. Baca kontrak bersama, content spec/release/decision log, architecture/OpenAPI, dan seluruh hasil Fase 03–06.
2. Pastikan status terdahulu `APPROVED`, sync E2E lulus, dan content Ch1–2 memperoleh editorial/product approval untuk dipublikasikan. `PROPOSED` atau keputusan matematika terbuka adalah blocker.
3. Jalankan baseline validator/tests/build, clean migration+seed rehearsal, dan `git status --short`.

Jangan mengubah naskah atau angka hanya untuk membuat test lewat. Jika approved content mustahil secara matematis, STOP dan kembalikan ke content gate.

## A. Publish content release

- Promosikan tepat release yang disetujui melalui workflow/command eksplisit; published release immutable.
- Seed/publish memakai stable ID, schema version, content version, SHA-256/checksum, locale, compatibility, dan asset manifest.
- Rerun payload identik no-op; version sama payload berbeda gagal keras.
- Validasi seluruh graph/reference, required nodes, reachability, terminal, reward source, dan formula.
- Chapter 1 harus mempunyai jalur survive serta fail yang sah. Chapter 2 harus mempunyai jalur nyata mencapai target approved tanpa uang tersembunyi/pinjaman yang tidak tercatat.
- Property/invariant test merekonsiliasi pemasukan, kebutuhan, pengeluaran, saving, simulated balance, XP/koin, badge, dan unlock.

## B. Gameplay/API completeness

Lengkapi Route Handlers `/api/v1` sesuai OpenAPI dan shared command handler:

- bootstrap/session/profile minimum;
- public-safe content manifest dan immutable pack dengan ETag/If-None-Match;
- chapter catalog, availability, prerequisites, progress/resume;
- playthrough/attempt start dan canonical snapshot;
- story choice, microlearning, minigame, boss start/submit/retry—baik melalui sync sebagai canonical mutation path maupun endpoint adapter approved;
- achievements/badges/unlocks/reward history yang aman;
- privacy/consent/export/delete dari Fase 04;
- sync dari Fase 05–06;
- liveness/readiness.

Semua mutation harus melalui satu application command handler, mengambil pemain dari session, memvalidasi ownership/content version, dan mengembalikan envelope/error code konsisten. Direct endpoint dan sync untuk intent sama harus menghasilkan state yang sama.

## C. Mini-game dan Boss

- `Sortir Cepat` menerima raw classification per item; server memilih/validasi item set deterministic dan menghitung score.
- `Dana Darurat` menerima allocation/decision/shock response mentah; server menghitung hasil sesuai content version.
- Timer offline hanya UX metadata, bukan bukti canonical.
- Boss Chapter 1–2 mempunyai state start/submit/fail/retry/pass immutable dan retry policy approved.
- Replay/double submit/parallel submit tidak menggandakan reward, badge, completion, streak, atau unlock.

## D. Capability pilot sekolah

Implementasikan hanya yang disetujui arsitektur, dengan feature flag default aman bila belum digunakan:

- school/cohort create/manage dan access-code enrollment;
- teacher summary berbasis cohort yang menjadi wewenangnya, data minimal/agregat;
- leaderboard pseudonim **opt-in**, scoped global/cohort sesuai policy, dengan anti-enumeration dan pagination;
- first-party analytics allowlist untuk funnel/content completion/performance tanpa PII/raw narrative payload;
- Web Push subscription/unsubscription self-hosted VAPID dan notification job interface; jangan hardcode key dan jangan memakai push SaaS;
- share/achievement card **data payload** aman; rendering visual ditunda.

Teacher tidak boleh melihat Player Code, credential, outbox, data cohort lain, atau detail yang tidak perlu. Analytics/push failure tidak boleh menggagalkan gameplay transaction.

Monetisasi, payment, iklan, Chapter 3–5, dan parent dashboard penuh tetap non-scope.

## E. Contract dan abuse hardening

- Sinkronkan OpenAPI/schema/error catalog dengan response aktual dan jalankan contract tests.
- Terapkan auth/ownership/RBAC, request/batch/body limit, pagination/cursor, rate limit, cache header, ETag, request ID, log redaction.
- Client-submitted XP/koin/saldo/score/pass/completion/unlock/rank diabaikan atau ditolak sesuai schema dan tidak pernah dipercaya.
- No-store pada response privat; content immutable dapat public-cache sesuai contract.

## F. Headless journey wajib

Buat test client yang benar-benar memakai HTTP API + PostgreSQL disposable:

1. buat akun pilot pseudonim, consent/enroll sesuai fixture;
2. bootstrap, download dan verify content pack;
3. selesaikan Ch1 success termasuk 7 scene, microlearning, Sortir Cepat, boss;
4. buktikan Survivor/badge/reward/unlock Ch2 tepat sekali;
5. selesaikan Ch2 termasuk budgeting, Dana Darurat, boss dan reward approved;
6. resume dari tengah setelah process/browser restart;
7. jalankan fail + retry path;
8. ulang request dan concurrent duplicate;
9. jalankan perjalanan online langsung serta offline-outbox-sync dan bandingkan canonical ledger/projection;
10. uji account A tidak dapat membaca/mutasi B;
11. teacher hanya melihat cohort sendiri; leaderboard tak memuat identifier sensitif;
12. analytics/push dimatikan/gagal tetapi gameplay tetap sukses;
13. export lalu delete akun test dan buktikan session/data behavior sesuai policy.

Rekonsiliasi expected cash, XP, koin, badge, unlock, event, dan ledger dari approved content; jangan hanya assert HTTP 200.

## Acceptance gate

- Fresh DB migrate+seed/publish tanpa langkah manual; seed kedua tidak berubah.
- Content validator/graph/math dan contract drift test lulus.
- Ch1–2 headless success/fail/retry lulus online dan offline.
- Concurrency/replay menghasilkan satu effect.
- Semua endpoint privat mempunyai unauthenticated, wrong-user, dan wrong-role test.
- Direct/sync mutation equivalence terbukti.
- Published content checksum sama dengan approval artifact.
- Lint, typecheck, seluruh unit/integration/contract/E2E, production build, `git diff --check`, secret/PII scan lulus.

Buat `docs/implementation/PHASE-07-STATUS.md` sebagai `PROPOSED`, plus endpoint matrix dan content release evidence. Jika editorial sign-off belum ada, jangan publish dan status `BLOCKED`.

## Handoff

Gunakan template handoff. Tambahkan version/checksum content, endpoint/auth/test matrix, rekonsiliasi ekonomi kedua chapter, headless journey transcript ringkas, feature-flag defaults, dan outstanding pilot limitation. Jangan lanjut ke Fase 08.

---

