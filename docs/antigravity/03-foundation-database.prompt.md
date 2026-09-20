# Prompt Fase 03 — Foundation dan Database

Jalankan hanya setelah content dan architecture gate disetujui.

---

Kamu bekerja di repository `finspire`. Implementasikan fondasi production backend dan PostgreSQL sesuai kontrak yang sudah disetujui. Jangan mengimplementasikan gameplay lengkap, offline runtime, atau UI final pada fase ini.

## Preflight wajib

1. Baca penuh `docs/antigravity/00-shared-contract.md`, seluruh `docs/content/`, `docs/architecture/`, kontrak machine-readable, dan ADR.
2. Pastikan `docs/content/STATUS.md` dan `docs/architecture/STATUS.md` berstatus `APPROVED` oleh reviewer, tidak ada blocking decision, dan working tree aman.
3. Baca `AGENTS.md` lalu dokumentasi Next.js lokal yang relevan di `node_modules/next/dist/docs/`; jangan mengandalkan pola versi lama.
4. Inspeksi `package.json`, lockfile, tsconfig, ESLint, Next config, dan struktur `src/` sebelum memilih dependency/file layout.
5. Jalankan validator konten/arsitektur dan baseline `npm run lint` serta `npm run build`. Catat kegagalan yang sudah ada sebelum perubahan.
6. Pastikan versi Node/npm/PostgreSQL yang akan dipakai sesuai ADR. Gunakan npm dan commit perubahan lockfile.

STOP bila approval belum ada, model data masih ambiguous, atau perubahan user bertabrakan.

## Scope implementasi

### A. Struktur modular server

Buat boundary yang mudah diuji dan tidak bergantung pada React:

- config/env;
- shared errors, IDs, clock, logging/redaction, request context;
- database client, transaction helper, schema, migrations, dan seed;
- module content, identity boundary placeholder, gameplay data, school/cohort, consent, rewards, sync receipts, analytics minimal;
- repository interface hanya bila benar-benar membantu testability;
- Route Handler tipis untuk health.

Domain module tidak boleh mengimpor `next/*`, React, Zustand, atau browser API. Server-only module tidak boleh masuk client bundle.

### B. Dependency dan environment

- Tambahkan hanya dependency open-source yang diputuskan ADR dan kompatibel dengan versi aktual: Drizzle, driver PostgreSQL, runtime validation, serta test tooling minimum.
- Verifikasi dari dokumentasi resmi/current package API sebelum coding. Jangan memasang package karena disebut PRD lama.
- Tambahkan `.env.example` dengan nama variabel dan contoh non-secret; validasi env fail-fast dengan pesan aman.
- Pisahkan `DATABASE_URL` runtime dan database test bila strategi tes memerlukannya. Dilarang menunjuk production dari test.
- Jangan commit `.env`, DSN, password, token, cookie secret, atau data sekolah nyata.

### C. PostgreSQL/Drizzle

Implementasikan schema dari `DATA_MODEL.md` secara modular. Wajib ada PK/FK, unique/check constraint, index, timestamp, enum/status strategy, dan delete behavior yang eksplisit. Minimal foundation mencakup:

- profile pseudonim serta school/cohort/membership;
- consent dan audit skeleton;
- installation;
- immutable content release dan content entity/reference sesuai ADR;
- playthrough/attempt/decision/result;
- action receipt/idempotency;
- append-only reward ledger dan projection;
- achievement/unlock/daily activity;
- sync cursor/checkpoint;
- minimal analytics/audit event.

Tabel khusus provider auth boleh diselesaikan di Fase 04, tetapi FK/boundary dan rencana migration harus jelas. Jangan membuat kolom chapter-specific yang harus ditambah setiap chapter baru. Semua nominal uang integer dengan check constraint yang sesuai.

Buat:

- konfigurasi Drizzle;
- migration SQL version-controlled yang dapat dijalankan non-interaktif;
- script status/migrate tanpa menjalankan migration otomatis pada setiap app request;
- transaksi helper yang benar-benar memakai satu connection/transaction context;
- query timeout/connection limit yang aman untuk satu VPS dan dapat dikonfigurasi;
- graceful connection shutdown untuk test/process.

Jangan memakai `push` schema sebagai prosedur production dan jangan menggunakan SQLite sebagai pengganti acceptance PostgreSQL.

### D. Seed deterministik

- Seed hanya data referensi dan content release yang telah disetujui.
- Gunakan stable ID dan checksum dari content pack, bukan UUID/random baru tiap run.
- Seed harus idempotent: run kedua tidak menduplikasi atau memutasi release immutable.
- Jangan seed akun nyata, email, nama siswa/sekolah nyata, PII survei, token, atau password default produksi.
- Fixture test harus jelas terpisah dan tidak dapat berjalan terhadap database production.

### E. API foundation dan health

Implementasikan sesuai OpenAPI:

- `GET /api/v1/health/live`: hanya membuktikan process hidup;
- `GET /api/v1/health/ready`: cek konektivitas database dan kompatibilitas migration/schema secara ringan;
- error envelope versioned, request/correlation ID, `serverTime`, dan redaction;
- readiness `503` ketika dependency kritis tidak siap, tanpa stack/DSN/detail internal.

Jangan membuat endpoint gameplay/auth palsu. Shared helper yang belum dipakai harus punya test dan alasan; hindari speculative framework.

### F. Test foundation

Sediakan scripts yang jelas untuk:

- lint;
- typecheck tanpa emit;
- unit;
- integration PostgreSQL;
- contract bila sudah ada;
- migration fresh DB;
- seed;
- build.

Gunakan PostgreSQL nyata yang disposable untuk integration test (Docker Compose/Testcontainers/local test DB sesuai ADR). Jika environment tidak memiliki Docker/PostgreSQL, selesaikan pemeriksaan statis yang aman tetapi beri status `BLOCKED`, bukan mengganti dengan SQLite atau mock lalu mengklaim PASS.

Test minimal:

- env validation dan secret redaction;
- clean migration pada database kosong;
- migration rerun/status;
- seed dua kali menghasilkan row/checksum sama;
- FK, unique, check, dan delete constraint penting;
- content release tidak dapat dimutasi lewat repository biasa;
- reward/action unique constraint tersedia;
- transaction rollback benar;
- live 200; ready 200 ketika DB sehat dan 503 ketika DB tidak tersedia;
- error response tidak membocorkan stack/DSN.

## Dokumentasi/output

Perbarui docs arsitektur hanya untuk deviation yang benar-benar ditemukan dan buat ADR amendment bila perlu; jangan mengubah keputusan diam-diam. Tambahkan:

- setup developer PostgreSQL;
- migration/seed commands;
- test database safety guard;
- troubleshooting singkat;
- `docs/implementation/PHASE-03-STATUS.md` berstatus `PROPOSED`, daftar migration dan bukti gate. Hanya reviewer boleh mengubah ke `APPROVED`.

## Larangan

- Tidak ada UI/styling/animasi/WebM final.
- Tidak ada auth flow atau credential produksi sebelum Fase 04.
- Tidak ada game calculation final sebelum Fase 05.
- Tidak ada service worker/IndexedDB sebelum Fase 06.
- Tidak ada migration destructive, data drop, atau reset database non-test.
- Jangan commit/push atau mengubah source lain yang tidak relevan.

## Acceptance gate

Laporkan exact command dan exit code untuk:

1. validator content dan architecture;
2. lint dan typecheck;
3. unit test;
4. PostgreSQL integration test;
5. fresh database migration;
6. seed dua kali dan invariant comparison;
7. production build;
8. `git diff --check`, `git status --short`, `git diff --stat`;
9. scan tracked diff untuk secret/PII dan verifikasi tidak ada perubahan UI.

PASS hanya jika database fresh dapat migrate+seed reproducibly, constraints benar-benar diuji di PostgreSQL, health contract sesuai, seluruh check lulus, dan tidak ada secret/PII. Tanpa PostgreSQL nyata, status harus `BLOCKED` untuk gate integrasi.

## Handoff

Gunakan `docs/antigravity/HANDOFF_TEMPLATE.md`. Sertakan diagram singkat schema yang benar-benar dibuat, daftar migration, dependency beserta alasan/lisensi, bukti seed kedua, dan cara reviewer menjalankan test DB. Jangan lanjut ke Fase 04.

---

