# Prompt Fase 05 — Game Engine dan Idempotency

Jalankan hanya setelah Fase 04 disetujui.

---

Kamu bekerja di repository `finspire`. Implementasikan mesin domain server-authoritative dan transaction/idempotency layer yang akan dipakai bersama oleh aksi online dan batch sync. Jangan membuat UI atau offline client pada fase ini.

## Preflight wajib

1. Baca kontrak bersama, content release yang approved, seluruh arsitektur/ADR, OpenAPI/error catalog, schema/migration, dan hasil Fase 03–04.
2. Pastikan semua status terdahulu `APPROVED`, PostgreSQL integration test lulus, dan aturan reward/retry/unlock pada content spec tidak lagi blocking.
3. Baca `AGENTS.md` serta dokumentasi framework lokal yang relevan. Inspeksi code boundary agar domain tetap framework-independent.
4. Jalankan baseline validator, tests, build, dan `git status --short`.

STOP jika konten yang menentukan consequence/reward masih `PROPOSED`, atau schema tidak mendukung unique/transaction invariant.

## Prinsip implementasi

- Domain function murni menentukan transition/result dari canonical state + approved content + raw intent + injected clock/random seed.
- Application command handler melakukan auth context, load, transaction, concurrency control, append event/ledger, dan update projection.
- Client tidak pernah mengirim nilai canonical seperti saldo akhir, score, XP, koin, badge, completion, unlock, rank, atau Foxy result state.
- Online endpoint kelak dan offline sync harus memanggil handler yang sama; jangan duplikasi business rule.

## Command dan result contract

Implementasikan command yang diperlukan content approved, minimal:

- start/resume playthrough atau chapter attempt;
- submit story choice;
- acknowledge/complete microlearning dengan anti-farming;
- start dan submit mini-game dari raw answer/classification/allocation;
- start, submit, dan retry Boss Challenge;
- derive chapter completion, badge/achievement, dan unlock;
- read/rebuild canonical player projection.

Setiap command memuat `actionId`, authenticated player context dari server, installation/sequence metadata, attempt IDs, content release/version, expected revision bila ditentukan, dan payload intent. Define discriminated union/schema; unknown field/type ditolak.

Result harus machine-readable dan memuat status canonical, receipt, revision/cursor, calculated consequence, projection/update, reward grant, dan stable error/conflict code. Jangan menjadikan copy UI sebagai logic key.

## Minimal transport vertical slice

Sebelum offline client dibuat, expose contract approved berikut sebagai Route Handler tipis:

- `GET /api/v1/content/manifest` dan immutable release/pack read;
- `GET /api/v1/bootstrap` untuk identity/projection/content pointer/cursor minimum;
- `POST /api/v1/sync` untuk ordered bounded action batch dengan result per item;
- health live/ready dari Fase 03.

Route hanya melakukan session/consent check, body limit, parse/validation, request ID, memanggil shared application handler, lalu mapping response. Identitas pemain hanya dari authenticated session, bukan payload. Batch yang valid secara sintaks boleh menghasilkan partial per-action result sesuai protokol; system failure tidak boleh diubah menjadi success palsu. Tambahkan cache header yang benar: content immutable dapat dicache, sedangkan bootstrap/auth/sync selalu private/no-store.

Jangan membuat direct gameplay mutation endpoint yang menjalankan rule berbeda. Endpoint tambahan dan capability API lengkap tetap Fase 07.

## Transaction dan idempotency

Implementasikan invariant approved secara nyata di PostgreSQL:

1. Unique receipt `(player_id, action_id)` atau key approved setara.
2. Simpan canonical payload hash serta result/receipt yang cukup untuk replay.
3. Action ID + payload sama mengembalikan result canonical yang sama tanpa effect baru.
4. Action ID sama + payload berbeda menghasilkan `IDEMPOTENCY_KEY_REUSED` dan tidak bermutasi.
5. Unique decision slot `(attempt_id, scene_id)` memastikan first valid commit wins.
6. Dua action ID dengan choice berbeda pada slot yang sama: satu diterima, satu `SCENE_ALREADY_DECIDED/CONFLICT` dengan canonical choice.
7. Ledger reward append-only memiliki unique source key sehingga scene/minigame/boss/chapter/streak tidak dapat memberi reward dua kali.
8. Receipt, decision/event, reward ledger, achievement/unlock, daily activity, dan player projection yang terkait ditulis atomik dalam satu transaksi.
9. Tentukan row lock/advisory lock/isolation strategy dari ADR dan buktikan concurrent test; check-then-insert di aplikasi saja tidak cukup.
10. Kegagalan sebelum commit tidak meninggalkan partial state. Kehilangan response setelah commit aman diretry.

Gunakan canonical JSON/hash strategy yang stabil dan versioned; jangan memasukkan timestamp transport yang berubah pada retry ke payload hash.

## Rules dan state machine

- Pin attempt ke content release awal; published rules immutable.
- Validasi prerequisites, current node, allowed choice, attempt lifecycle, retry count, dan content compatibility sebelum mutasi.
- Semua uang integer rupiah dan domain tidak membolehkan overflow/NaN/float.
- Story cash, Koin Foxy, dan XP adalah ledger/dimension terpisah.
- Mini-game menerima raw answer dan server menghitung score dari approved rubric/item set; timer client bukan bukti tepercaya.
- Boss pass/fail/retry dihitung server. Reward completion hanya sekali meski replay atau retry berhasil berulang.
- Streak memakai tanggal bisnis `Asia/Jakarta` yang dihitung dari server clock. Clock dapat diinjeksi untuk test; client time hanya metadata.
- Projection harus dapat direkonsiliasi atau dibangun ulang dari canonical event/ledger sesuai ADR.
- Canonical Foxy state adalah semantic key; tidak ada asset URL atau animasi logic di domain.

## Validation dan safety

- Batasi action type, payload size/count, integer range, string length, attempt ownership, dan content reference.
- Return stable validation/conflict codes tanpa stack atau data pemain lain.
- Jangan mencatat raw sensitive/auth payload. Gameplay event/analytics harus minimal dan pseudonim.
- Jangan menjalankan expression/eval dari content. Content adalah deklaratif dan divalidasi.

## Test wajib

### Unit/domain

- success/failure path tiap command;
- boundary nominal, prerequisite, state transition, boss retry, reward policy;
- raw mini-game scoring dan tampered client calculated fields ditolak/diabaikan sesuai kontrak;
- deterministic clock/random/content fixture;
- projection rebuild sama dengan projection incremental.

### PostgreSQL integration/concurrency

- 10+ request identik paralel menghasilkan satu decision/event dan satu set reward;
- action ID sama dengan payload berbeda;
- dua pilihan berbeda paralel untuk scene yang sama;
- timeout/lost-response simulation lalu retry;
- failure injection antara steps membuktikan rollback;
- replay mini-game/boss/chapter complete;
- concurrent streak/activity;
- stale revision dan version mismatch;
- unauthorized attempt/player ownership;
- ledger total dan projection selalu tere-konsiliasi.

Jangan mengganti concurrency test dengan sequential mock. Simpan output/query assertion yang membuktikan row count dan ledger uniqueness.

## Output dan batas fase

- Implementasikan domain/application/repository code, schema amendment/migration yang diperlukan, serta test.
- Sinkronkan contract/docs bila implementation detail berubah tanpa mengubah approved product semantics.
- Buat `docs/implementation/PHASE-05-STATUS.md` berstatus `PROPOSED` dengan invariant evidence.
- Jangan implementasikan UI, IndexedDB, service worker, PWA caching, direct gameplay routes di luar vertical slice, deployment, leaderboard, atau chapter baru.

## Acceptance gate

Jalankan seluruh validator terdahulu, lint, typecheck, unit, PostgreSQL integration/concurrency tests, migration dari DB kosong dan upgrade path, seed idempotency, contract tests, serta production build. Jalankan `git diff --check`, secret/PII scan, `git status --short`, dan `git diff --stat`.

PASS hanya bila concurrent/replay/lost-response tests membuktikan effect sekali melalui domain dan `POST /api/v1/sync`, server mengabaikan nilai reward client, projection tere-konsiliasi, response/cache contract sesuai, dan seluruh command memakai content release approved. Tanpa PostgreSQL concurrency test nyata, status `BLOCKED`.

## Handoff

Gunakan `docs/antigravity/HANDOFF_TEMPLATE.md`. Sertakan command matrix, transaction boundary, daftar unique constraint, hasil row-count concurrency, contoh duplicate/conflict result, dan daftar failure injection. Jangan lanjut ke Fase 06.

---
