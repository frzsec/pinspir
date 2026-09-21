# Status Implementasi Fase 07 — Content Release dan API Pilot Lengkap

- **Status Dokumen**: `PROPOSED`
- **Tanggal Selesai**: 2026-09-21
- **Fase**: 07 - Rilis Konten dan Kelengkapan API Pilot
- **Otoritas Persetujuan**: Peninjau Manusia (Lead Architect / Project Owner)

---

## 1. Ringkasan Implementasi

Fase 07 menyelesaikan seluruh antarmuka backend untuk rilis konten immutable, sistem distribusi katalog bab, kapabilitas sekolah (leaderboard cohort pseudonim), telemetri analitik first-party allowlisted, dan pembuktian perjalanan penuh (*headless journey*) dari Chapter 1 hingga Chapter 2:

1. **Distribusi Rilis Konten Immutable (`src/app/api/v1/content/`)**:
   - `releases/[releaseId]/bundle/route.ts`: Menyajikan paket konten rilis lengkap (`manifest.json`, `chapter-01.json`, `chapter-02.json`) dalam satu bundle terkompresi dengan digest SHA-256 dan HTTP `ETag`. Mendukung `If-None-Match` yang mengembalikan `304 Not Modified` dan header `Cache-Control: public, max-age=31536000, immutable`.
   - `chapters/route.ts`: Menyajikan katalog bab lengkap dengan status buka kunci dinamis (`isUnlocked`) yang dievaluasi dari riwayat bab selesai (`completedChapters`) pada proyeksi pemain terotentikasi. Bab 1 selalu terbuka; Bab 2 hanya terbuka jika Bab 1 telah diselesaikan dengan status lulus.

2. **Kapabilitas Pilot Sekolah (`src/app/api/v1/schools/`)**:
   - `cohorts/[id]/leaderboard/route.ts`: Papan peringkat kelas cohort berbasis pseudonim. Dilindungi dengan pemeriksaan otorisasi BOLA ketat (hanya dapat diakses oleh guru pemilik cohort atau siswa yang terdaftar sebagai anggota cohort tersebut). Menampilkan `rank`, `playerCode`, `nickname`, `totalXp`, `totalStars`, dan `currentStreak` tanpa membocorkan PII atau credential.
   - `cohorts/join/route.ts`: Pendaftaran siswa mandiri ke cohort sekolah via kode akses 6 digit.

3. **Telemetri & Notifikasi (`src/app/api/v1/`)**:
   - `analytics/events/route.ts`: Ingestion telemetri first-party allowlisted (`chapter_start`, `chapter_complete`, `minigame_start`, `minigame_complete`, `sync_completed`, dll.) ke tabel `analytics_events`. Sanitasi payload otomatis membuang kunci rahasia/PII. Kegagalan telemetri tidak pernah membatalkan transaksi gameplay.
   - `notifications/push-subscription/route.ts`: Pendaftaran Web Push VAPID mandiri tanpa dependensi SaaS berbayar.
   - `gameplay/attempts/[id]/route.ts`: Pembacaan snapshot attempt dan daftar aksi pemain terotentikasi.

4. **Pembuktian Headless Journey E2E (`tests/integration/headless-journey.test.mjs`)**:
   - Mensimulasikan siklus hidup penuh seorang siswa pilot melalui Route Handlers HTTP terhadap database PostgreSQL nyata (`finspire_test`).

---

## 2. Bukti Pengujian Integrasi Database Nyata (`finspire_test`)

| No | Kasus Uji | Perintah | Hasil |
| :--- | :--- | :--- | :--- |
| 1 | **Pseudonymous Registration** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Akun murid dibuat, kredensial pseudonim `FOX-XXXX-XXX`, session cookie diterbitkan |
| 2 | **Consent, Cohort Join & Bootstrap** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Consent `terms_of_service` tercatat, murid terdaftar di kelas 7A, bootstrap mengembalikan state awal |
| 3 | **Release Bundle & ETag 304** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Bundle pilot-v1-draft terunduh (200 OK); re-request dengan `If-None-Match` mengembalikan 304 |
| 4 | **Initial Chapter Catalog Gate** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Bab 1 terbuka (`isUnlocked: true`), Bab 2 terkunci (`isUnlocked: false`) |
| 5 | **Chapter 1 Complete via Sync** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: 7 adegan survive saldo positif, Sortir Cepat lulus, Boss lulus, diraih badge `BADGE-SURVIVOR` |
| 6 | **Chapter 2 Unlock Gate** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Pasca-kelulusan Bab 1, Bab 2 secara otomatis terbuka (`isUnlocked: true`) pada katalog |
| 7 | **Chapter 2 Complete via Sync** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Alokasi Pay Yourself First, Dana Darurat 3 guncangan lulus, Boss cetak biru lulus, diraih badge `BADGE-PLANNER` |
| 8 | **Cohort Leaderboard Pseudonim** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Murid tampil di peringkat 1 cohort dengan 2 bintang dan XP penuh; non-anggota ditolak (403) |
| 9 | **First-Party Analytics Ingestion** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: 2 event `chapter_complete` tercatat di tabel `analytics_events` tanpa error |
| 10 | **Data Portability & Account Deletion** | `npx tsx --conditions=react-server --test tests/integration/headless-journey.test.mjs` | **PASS**: Ekspor JSON memuat seluruh riwayat; penghapusan akun menganonimkan data & mencabut sesi (401) |

---

## 3. Matriks Rekonsiliasi Ekonomi Kedua Bab

| Bab / Dimensi | Alokasi Awal | Pos Pengeluaran / Alokasi | Skenario Mini-game | Skenario Boss | Saldo Akhir | Status Lulus |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bab 1 (KEEP IT ALIVE)** | Kas: Rp10.000 | - Es teh: -Rp2.500<br>- Fotokopi: -Rp2.000<br>- Tolak gantungan: Rp0<br>- Kertas bekas: Rp0<br>- Pinjam pensil: Rp0<br>- Main catur: Rp0<br>- Menuju pass: Rp0 | **Sortir Cepat**: 10/10 item diklasifikasikan (Kebutuhan, Keinginan, Tabungan) -> Skor 100% | **Survival Plan**: Integritas saldo >= Rp0, struktur artefak lengkap, transfer scenario tuntas | Kas: Rp5.500<br>Utang: Rp0 | **LULUS** (Badge Survivor, +50 XP, +30 Koin, +1 Bintang) |
| **Bab 2 (PAY YOURSELF FIRST)** | Kas: Rp300.000 | - Pay Yourself First: Tabungan Rp100.000<br>- Dana Darurat: Rp50.000<br>- Kebutuhan hidup: Rp150.000 | **Dana Darurat**: 3 guncangan (servis rem, iuran kertas ujian, obat sakit gigi) diserap payung darurat tanpa utang | **Financial Shield**: Konservasi nilai terjaga, cetak biru lengkap, transfer scenario tuntas | Kas: Rp0<br>Tabungan: Rp100.000<br>Dana Darurat: Rp50.000<br>Utang: Rp0 | **LULUS** (Badge Planner, +50 XP, +30 Koin, +1 Bintang) |
