# Status Implementasi Fase 05 — Game Engine dan Idempotency

- **Status Dokumen**: `PROPOSED`
- **Tanggal Selesai**: 2026-09-21
- **Fase**: 05 - Game Engine Server & Idempotency / Sync Batch Handler
- **Otoritas Persetujuan**: Peninjau Manusia (Lead Architect / Project Owner)

---

## 1. Ringkasan Implementasi

Fase 05 mengimplementasikan mesin game server-authoritative murni, protokol sinkronisasi batch offline, invarian idempotensi tingkat database, dan pertahanan terhadap kecurangan klien (*client tampering & replay attacks*) sesuai dengan spesifikasi ADR-003, ADR-004, dan kontrak arsitektur:

1. **Mesin Domain Murni (`src/lib/game/`)**:
   - `types.ts`: Definisi kontrak tipe data kanonikal untuk akun uang simulasi (`availableCash`, `goalSavings`, `emergencyFund`, `debt`), transisi scene, evaluasi rubric, snapshot kanonikal, dan payload batch sinkronisasi.
   - `content-loader.ts`: Pemuat rilis konten deterministik dengan verifikasi checksum SHA-256, caching in-memory, dan dukungan immutable release pack.
   - `narrative-engine.ts`: Fungsi murni evaluasi transisi pilihan cerita, verifikasi prasyarat saldo (`requiredConditions.minCash`), proteksi saldo minus (*non-negative invariant*), kalkulator rubrik mini-game `Sortir Cepat` (Chapter 1) dan `Dana Darurat` (Chapter 2), serta evaluator tantangan Boss 3 dimensi berbobot (*balance integrity, artifact completeness, transfer scenario*). Klien tidak pernah mengirimkan skor, koin, atau XP.
   - `streak-engine.ts`: Perhitungan streak harian bisnis berbasis zona waktu Indonesia Barat (`Asia/Jakarta`, WIB). Perubahan jam lokal klien tidak memengaruhi validitas streak.
   - `projection-rebuilder.ts`: Rekonsiliasi proyeksi pemain dari tabel append-only `reward_ledger` dan `playthrough_attempts`. Proyeksi terbukti 100% identik dengan akumulasi incremental.
   - `sync-handler.ts`: Application command handler yang mengorkestrasi transaksi ACID PostgreSQL (`db.transaction`) untuk memproses batch aksi gameplay secara sekuensial dan atomik.

2. **Invarian Idempotensi & Resolusi Konflik Konkuren**:
   - **Idempotent Replay**: Request dengan `action_id` dan payload yang identik mengembalikan hasil kanonikal tersimpan dengan kode `IDEMPOTENT_RETRY` (status `duplicate`) tanpa menimbulkan efek ganda.
   - **Idempotency Key Reuse Detection**: Penggunaan ulang `action_id` yang sama untuk payload atau scene berbeda ditolak keras dengan kode `IDEMPOTENCY_KEY_REUSED` (status `rejected`).
   - **First-Accepted Decision Wins**: Penegakan batasan unik `uq_gameplay_attempt_node` pada `(attempt_id, scene_node_id)`. Pilihan pertama yang di-commit dinyatakan menang (`accepted`), sedangkan pilihan berbeda berikutnya ditandai sebagai konflik (`SCENE_ALREADY_DECIDED`, status `conflict`) dan menyertakan pilihan kanonikal terdahulu.
   - **Anti-Duplikasi Reward**: Batasan unik `uq_reward_ledger_source` pada `(user_id, release_id, source_node_id, reward_type)` menjamin bahwa stres pengujian 10 request paralel identik hanya menghasilkan tepat 1 baris reward ledger.

3. **Route Handlers Transport Slice**:
   - `POST /api/v1/sync` & `POST /api/v1/sync/batch`: Memproses batch hingga 50 aksi gameplay, memvalidasi otentikasi sesi pemain, mengeksekusi command handler, dan mengembalikan hasil per-aksi beserta `canonicalSnapshot` dan cursor sinkronisasi (`Cache-Control: private, no-store`).
   - `GET /api/v1/bootstrap`: Mengambil identitas sesi, pointer rilis aktif, proyeksi terkini, dan status streak (`Cache-Control: private, no-store`).
   - `GET /api/v1/content/manifest`: Menyajikan manifest rilis konten aktif dengan cache publik yang aman (`Cache-Control: public, max-age=3600, stale-while-revalidate=86400`).

---

## 2. Bukti Pengujian Integrasi Database Nyata (`finspire_test`)

Seluruh pengujian Fase 05 dijalankan terhadap basis data PostgreSQL lokal nyata (`tests/integration/gameplay-sync.test.mjs`):

| No | Kasus Uji | Perintah | Hasil |
| :--- | :--- | :--- | :--- |
| 1 | **Domain Mini-game & Boss Rubric Evaluation** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Mini-game Sortir Cepat & Dana Darurat dihitung dari raw answers, Boss evaluasi rubric 3 dimensi lolos |
| 2 | **Streak Engine WIB Date Calculations** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Aktivitas hari yang sama mempertahankan streak; hari berikutnya menambah streak; jeda > 1 hari mereset streak |
| 3 | **Sync Batch Sequential Execution & Reward Grants** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Start attempt + pilihan scene mengeksekusi mutasi saldo kas (Rp10.000 -> Rp7.500) dan mencatat reward ledger |
| 4 | **Idempotency Key Replay vs Key Reused** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Replay identik menghasilkan `duplicate` (`IDEMPOTENT_RETRY`); reuse ID menghasilkan `rejected` (`IDEMPOTENCY_KEY_REUSED`) |
| 5 | **First-Accepted Decision Wins (Conflict Resolution)** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Opsi A menang; Opsi B pada slot yang sama ditolak dengan status `conflict` (`SCENE_ALREADY_DECIDED`) |
| 6 | **Concurrency Stress Test: 10 Parallel Requests** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Tepat 1 request diterima (`accepted`), 9 request kembali sebagai duplikat (`duplicate`), dan tepat 1 entri reward di ledger |
| 7 | **Complete Journey, Boss Pass & Projection Rebuild** | `tsx --conditions=react-server --test tests/integration/gameplay-sync.test.mjs` | **PASS**: Mini-game pass + Boss pass menganugerahi badge Survivor; hasil rebuild proyeksi dari ledger 100% konsisten |
