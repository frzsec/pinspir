# Status Implementasi Fase 03 — Foundation & Database

- **Status Dokumen**: `PROPOSED`
- **Tanggal Selesai**: 2026-09-21
- **Fase**: 03 - Foundation dan Database
- **Otoritas Persetujuan**: Peninjau Manusia (Lead Architect / Project Owner)

---

## 1. Ringkasan Implementasi

Fase 03 mengimplementasikan seluruh fondasi layer akses data dan infrastruktur backend PostgreSQL produksi sesuai kontrak arsitektur yang telah disetujui pada Fase 02:

1. **Modular Server Libraries (`src/lib/`)**:
   - `src/lib/config/env.ts`: Pemuatan variabel lingkungan fail-fast dengan redaksi DSN dan isolasi `server-only`.
   - `src/lib/clock/index.ts`: Provider waktu deterministik (`IClockProvider`) terikat zona waktu `Asia/Jakarta` (WIB) dan `MockClockProvider` untuk pengujian.
   - `src/lib/ids/index.ts`: Generator UUID v4 sistem (`SystemUuidGenerator`) dan deret deterministik (`DeterministicUuidGenerator`) serta validasi format UUID.
   - `src/lib/errors/index.ts`: Kelas error standar (`BadRequestError`, `NotFoundError`, `ConflictError`, `ServiceUnavailableError`) dengan pemformat amplop error sesuai `API_CONTRACT.md`.
   - `src/lib/logger/index.ts`: Logger terstruktur dengan sanitasi otomatis untuk field rahasia (`passphrase`, `password`, `token`, `sessionToken`, `cookie`, `secret`).
2. **Skema Drizzle ORM Modular (`src/db/schema/`)**:
   - 16 tabel kanonikal terdefinisi: `users`, `accounts`, `sessions`, `schools`, `cohorts`, `cohort_members`, `user_consents`, `credential_reset_audits`, `client_installations`, `content_releases`, `playthrough_attempts`, `gameplay_actions`, `reward_ledger`, `player_projections`, `player_streaks`, `analytics_events`.
   - Batasan integritas unik kritis:
     - `reward_ledger`: `uq_reward_ledger_source` pada `(user_id, release_id, source_node_id, reward_type)` untuk anti-duplikasi reward.
     - `gameplay_actions`: `uq_gameplay_attempt_node` pada `(attempt_id, scene_node_id)` untuk *first-accepted decision wins*.
     - `cohort_members`: `uq_cohort_member` pada `(cohort_id, user_id)`.
   - Check constraints: Nilai integer non-negatif pada `reward_ledger.amount`, `playthrough_attempts.score_mastery`, `player_projections.total_xp`, `player_projections.total_stars`, `player_streaks.current_streak`.
3. **Migrasi Database Terkontrol**:
   - Berkas migrasi SQL versi-terkontrol: `src/db/migrations/0000_odd_the_captain.sql`.
   - Skrip eksekutor migrasi non-interaktif: `scripts/migrate.mjs`.
4. **Seeding Konten Deterministik**:
   - Skrip `scripts/seed-pilot-content.mjs` mengimpor `pilot-v1-draft` dengan verifikasi digest SHA-256 dan data sekolah referensi secara idempoten.
5. **Route Handler Health Probe**:
   - `GET /api/v1/health/live`: Pembuktian proses hidup (`status: "ok"`, `serverTime`).
   - `GET /api/v1/health/ready`: Pemeriksaan konektivitas database (`status: "ready"` / `503 Service Unavailable` tanpa kebocoran DSN).

---

## 2. Panduan Penyiapan Pengembang (Developer Setup Guide)

### 2.1 Konfigurasi PostgreSQL Lokal

1. Salin template lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Pastikan PostgreSQL 16/18 aktif pada `127.0.0.1:5432` dan sesuaikan kredensial di `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/finspire_dev
   TEST_DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/finspire_test
   ```
3. Buat database:
   ```sql
   CREATE DATABASE finspire_dev;
   CREATE DATABASE finspire_test;
   ```

### 2.2 Perintah Eksekusi Migrasi & Seeding

```bash
# Menjalankan migrasi Drizzle ke database pengembangan
npm run db:migrate

# Melakukan seeding rilis konten pilot & sekolah percontohan
npm run db:seed
```

### 2.3 Perintah Eksekusi Seluruh Suite Pengujian

```bash
# Menjalankan linter & typecheck
npm run lint
npm run typecheck

# Menjalankan seluruh tes (konten, unit, integrasi PostgreSQL nyata)
npm test

# Menjalankan build produksi Next.js
npm run build
```

---

## 3. Bukti Verifikasi Kriteria Pintu Keluar (Exit Gate Verification)

| Pengujian / Gate | Perintah | Status | Hasil Ringkas |
| :--- | :--- | :--- | :--- |
| **Linting** | `npm run lint` | **PASS (0)** | 0 error, 0 warning pada seluruh berkas TS & MJS |
| **Typecheck** | `npm run typecheck` | **PASS (0)** | TypeScript strict lolos tanpa emit error |
| **Validator Konten** | `npm run test:content` | **PASS (0)** | 13/13 tes regresi validator konten lolos |
| **Unit Tests** | `npm run test:unit` | **PASS (0)** | 9/9 unit tests (env, clock, UUID, logger, errors) lolos |
| **PostgreSQL Integration** | `npm run test:integration` | **PASS (0)** | 7/7 tes integrasi database nyata (finspire_test) lolos |
| **Fresh DB Migration** | `node scripts/migrate.mjs` | **PASS (0)** | Skema 16 tabel & constraints terpasang bersih |
| **Double Seed Idempotency** | `node scripts/seed-pilot-content.mjs` | **PASS (0)** | Run kedua mendeteksi rilis & mengabaikan duplikasi |
| **Build Produksi** | `npm run build` | **PASS (0)** | Next.js 16.3.5 compiled & routes live/ready dynamic |

---

## 4. Panduan Penanganan Masalah (Troubleshooting)

| Gejala | Penyebab Umum | Solusi |
| :--- | :--- | :--- |
| `connection to server failed: FATAL: password authentication failed` | Kredensial di `.env` berbeda dengan konfigurasi PostgreSQL lokal. | Perbarui variabel `DATABASE_URL` dan `TEST_DATABASE_URL` dengan kata sandi yang valid. |
| `This module cannot be imported from a Client Component module` | Modul `src/db/*` diimpor di komponen klien tanpa `'use server'`. | Pastikan interaksi database hanya dilakukan di Route Handlers atau Server Actions. |
| `duplicate key value violates unique constraint "uq_reward_ledger_source"` | Percobaan mencatat reward ganda untuk node yang sama pada user yang sama. | Ini adalah perilaku invarian yang diharapkan (*expected invariant behavior*). Tangkap error dan kembalikan status `duplicate`. |
