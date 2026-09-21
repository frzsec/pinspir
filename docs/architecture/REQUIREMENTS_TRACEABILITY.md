# Matriks Ketertelusuran Kebutuhan (Requirements Traceability Matrix)

Dokumen ini memetakan setiap kebutuhan fungsional dan non-fungsional Finspire dengan kode kategori (`CNT`, `AUTH`, `GAME`, `OFF`, `SCH`, `OPS`, `PRIV`) terhadap sumber keputusan, entitas data pemilik, endpoint/komponen pelaksana, aturan invarian, ID kasus uji, dan fase implementasi.

---

## 1. Tabel Matriks Ketertelusuran Penuh

| Kode Kebutuhan | Sumber / Decision ID | Pemilik Data (Source of Truth) | Tabel / Entitas Data | Endpoint / Komponen Internal | Aturan Invarian Kritis | ID Kasus Uji | Fase Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CNT-01** | PRD Bab 7 / ADR-005 | Authoring Repo (Git) | `content_releases` | `scripts/validate-content.mjs` | Konten valid sesuai JSON Schema Draft 2020-12; SHA-256 manifest cocok 100%. | `TC-CNT-001` | Fase 01R / 03 |
| **CNT-02** | PRD Bab 7 / ADR-005 | Database Server (Postgres) | `content_releases` | `POST /api/v1/content/releases/:id/activate` | Tepat satu rilis berstatus `active` per saat; rollback bersifat non-destruktif. | `TC-CNT-002` | Fase 03 |
| **CNT-03** | PRD Bab 7.4 / ADR-005 | Authoring Manifest | `manifest.json` (`assetDictionary`) | `VisualStage.tsx` | Seluruh video WebM transparan wajib memiliki `posterPath` dan alternatif `reducedMotion`. | `TC-CNT-003` | Fase 06 |
| **AUTH-01** | PRD Bab 4 / ADR-002 | Database Server (Postgres) | `users`, `accounts` | `POST /api/v1/auth/pseudonymous/register` | Player Code berformat `FOX-XXXX-YYY`; tidak memungut email atau nomor telepon murid. | `TC-AUTH-001` | Fase 04 |
| **AUTH-02** | PRD Bab 4 / ADR-002 | Nginx / In-memory Store | Cache memori IP limiter | `middleware.ts` | Maksimal 5 percobaan login gagal per IP per 10 menit (HTTP 429). | `TC-AUTH-002` | Fase 04 / 08 |
| **AUTH-03** | PRD Bab 4 / ADR-002 | Database Server (Postgres) | `credential_reset_audits` | `POST /api/v1/schools/cohorts/:id/reset-credential` | Reset kredensial murid hanya dapat diinisiasi oleh guru pengampu kelasnya; dicatat di audit log. | `TC-AUTH-003` | Fase 04 / 07 |
| **GAME-01** | PRD Bab 6 / ADR-003 | Database Server (Postgres) | `reward_ledger` | `sync-evaluator.service.ts` | Reward hanya dicatat server; `UNIQUE(user_id, release_id, source_node_id, reward_type)`. | `TC-GAME-001` | Fase 05 |
| **GAME-02** | PRD Bab 6.2 / Shared Contract | Database Server (Postgres) | `player_projections` | `sync-evaluator.service.ts` | Klien tidak boleh mengirimkan delta XP/bintang; seluruh proyeksi dapat dibangun ulang dari ledger. | `TC-GAME-002` | Fase 05 |
| **GAME-03** | PRD Bab 6.5 / Shared Contract | Database Server (Postgres) | `player_streaks` | `ClockProvider` (`Asia/Jakarta`) | Streak harian dihitung berdasarkan stempel waktu server zona WIB, bukan jam lokal perangkat klien. | `TC-GAME-003` | Fase 05 |
| **OFF-01** | PRD Bab 5 / ADR-004 | Klien (IndexedDB) | `sync_outbox` (IndexedDB) | `sync-state-machine.ts` | Aksi bermain disimpan lokal saat offline; dipertahankan hingga mendapat konfirmasi server. | `TC-OFF-001` | Fase 05 |
| **OFF-02** | PRD Bab 5 / ADR-004 | Database Server (Postgres) | `gameplay_actions` | `POST /api/v1/sync/batch` | Idempotensi penuh: Pengiriman batch identik berulang menghasilkan `duplicate` tanpa mutasi reward. | `TC-OFF-002` | Fase 05 |
| **OFF-03** | PRD Bab 5 / ADR-004 | Database Server (Postgres) | `gameplay_actions` | `POST /api/v1/sync/batch` | First-accepted decision wins: Aksi berbeda untuk `scene_node_id` yang sama menghasilkan `conflict`. | `TC-OFF-003` | Fase 05 |
| **SCH-01** | PRD Bab 4.3 / ADR-001 | Database Server (Postgres) | `cohorts`, `cohort_members` | `GET /api/v1/schools/cohorts/:id/summary` | Anti-IDOR: Guru hanya berhak mengakses rekapitulasi data kelas yang ditugaskan kepadanya. | `TC-SCH-001` | Fase 07 |
| **SCH-02** | PRD Bab 4.3 / Shared Contract | Database Server (Postgres) | `cohorts` | `POST /api/v1/schools/cohorts/join` | Murid dapat bergabung ke kelas menggunakan Kode Kelas 6 digit tanpa pertukaran identitas nyata. | `TC-SCH-002` | Fase 07 |
| **OPS-01** | PRD Bab 8 / ADR-006 | Sistem Operasi VPS (Linux) | Host Filesystem / Cron | `deploy/scripts/backup-db.sh` | Pencadangan database lokal otomatis harian terenkripsi; restore menghasilkan data 100% identik. | `TC-OPS-001` | Fase 09 |
| **OPS-02** | PRD Bab 8 / ADR-006 | Nginx Reverse Proxy | Nginx Daemon | `deploy/nginx/finspire.conf` | Ukuran payload request dibatasi maksimal 1MB; memblokir serangan pengiriman batch raksasa. | `TC-OPS-002` | Fase 09 |
| **PRIV-01** | PRD Bab 9 / ADR-002 | Klien & Server | Cookie & IndexedDB | `CleanSignOutButton.tsx` | Tombol Keluar Bersih menghapus cookie sesi, outbox aksi tersinkronisasi, dan mengunci layar login lab. | `TC-PRIV-001` | Fase 08 |
| **PRIV-02** | PRD Bab 9 / ADR-001 | File Log Aplikasi | Host Log Filesystem | `sanitizeLogPayload()` | Passphrase, cookie sesi, dan token otentikasi diredaksi menjadi `[REDACTED]` dalam log server. | `TC-PRIV-002` | Fase 04 / 08 |
| **PRIV-03** | PRD Bab 9 / ADR-001 | Database Server (Postgres) | `users`, `playthrough_attempts` | `DELETE /api/v1/consent/account` | Penghapusan akun memutus kaitan data bermain (`user_id = NULL`) setelah grace period 7 hari. | `TC-PRIV-003` | Fase 04 |

---

## 2. Audit Kesenjangan (Gap Analysis)

- **Requirement Tanpa Pemilik Data (Source of Truth)**: 0 (Semua kebutuhan terikat secara tegas pada server PostgreSQL, klien IndexedDB, atau authoring repo).
- **Requirement Tanpa ID Kasus Uji**: 0 (Semua kebutuhan memiliki kasus uji terdaftar dalam `TEST_STRATEGY.md`).
- **Requirement Tanpa Penetapan Fase**: 0 (Semua terpetakan ke Fase 03–09 dalam `IMPLEMENTATION_PLAN.md`).
- **Status Ketertelusuran**: **Lengkap & Terverifikasi (Complete & Consistent)**.
