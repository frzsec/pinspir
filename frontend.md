# Cetak Biru & Roadmap Implementasi Frontend Finspire

Dokumen ini mendefinisikan rancangan teknis dan panduan pengerjaan bertahap (**Tahap 0 s.d. Tahap 8**) untuk membangun antarmuka pengguna (**Frontend PWA**) Finspire. Seluruh implementasi dijalankan langsung di dalam proyek `Finspire-JHIC-DB` untuk memanfaatkan satu ekosistem Next.js 16 (App Router), autentikasi berbasis cookie `HttpOnly`, dan dependensi siap pakai (`motion`, `zustand`, `tailwindcss`, `canvas-confetti`).

---

## 1. Ringkasan Eksekutif & Filosofi Desain

Finspire adalah **financial RPG / visual novel microlearning** untuk siswa SMA/SMK (usia 16–17 tahun) bersama maskot **Foxy**.

### Prinsip Utama Frontend:
1. **Mobile-First & Responsif**: Dioptimalkan untuk layar ponsel siswa (360px – 430px) dengan transisi mulus saat dibuka di tablet atau laptop.
2. **Offline-First & Tangguh**: Siswa dapat mengunduh paket bab saat online, memainkannya sepenuhnya tanpa koneksi internet, lalu menyinkronkan progres saat kembali terhubung.
3. **Server-Authoritative**: Frontend menghitung state *provisional* (tampilan cepat seketika), namun server yang memvalidasi dan mencatat reward serta kelulusan resmi via `/api/v1/sync`.
4. **Privasi Siswa (Zero PII)**: Tidak ada pengumpulan nama asli, email, atau nomor HP. Siswa menggunakan **Player Code** (`FOX-XXXX-XXX`) dan **Passphrase**.
5. **Estetika Gen-Z Modern**: Menggunakan warna vibrant, mode gelap/terang, micro-interactions dengan `motion`, dan selebrasi visual kelulusan.

---

## 2. Struktur Direktori Frontend Target

```
src/
├── app/
│   ├── (game)/
│   │   ├── play/
│   │   │   └── [chapterId]/
│   │   │       ├── page.tsx            # Visual novel dialog & adegan interaktif
│   │   │       ├── minigame/page.tsx   # Mini-game (Sortir Cepat / Dana Darurat)
│   │   │       └── boss/page.tsx       # Boss Challenge & formulir cetak biru
│   │   ├── leaderboard/page.tsx        # Leaderboard cohort pseudonim
│   │   └── profile/page.tsx            # Privasi, ekspor data JSON & pengaturan
│   ├── auth/
│   │   ├── login/page.tsx              # Masuk dengan Player Code & Passphrase
│   │   └── register/page.tsx           # Registrasi pseudonim 1-klik & Consent ToS
│   ├── layout.tsx                      # Root layout, font, metadata PWA
│   ├── page.tsx                        # Dashboard utama & peta perjalanan
│   └── sw-register.tsx                 # Registrasi Service Worker client
│
├── components/
│   ├── auth/                           # Komponen login, register, modal ToS
│   ├── dashboard/                      # Top HUD, kartu bab, banner cohort
│   ├── narrative/                      # Avatar Foxy, kotak dialog, kartu opsi
│   ├── minigames/                      # Mini-game Sortir Cepat & Payung Darurat
│   ├── boss/                           # Builder blueprint & victory screen
│   ├── common/                         # Button, modal, sync pill, badge chip
│   └── pwa/                            # Prompt install PWA
│
├── lib/
│   ├── client-db/                      # Skema IndexedDB & Outbox Manager
│   ├── sync/                           # Sync Coordinator & Conflict Resolver
│   ├── stores/                         # Zustand Stores (Auth, Gameplay, Sync)
│   └── audio/                          # Efek suara game (SFX)
│
└── public/
    ├── manifest.json                   # Web App Manifest PWA
    ├── sw.js                           # Service Worker offline cache
    └── icons/                          # Asset icon PWA & maskot
```

---

## 3. Roadmap Pengerjaan Bertahap

---

### 🟩 Tahap 0: Fondasi, Design System, & Setup Aset
**Tujuan**: Menyiapkan fondasi visual, token tema, sistem tipografi, dan utilitas dasar yang akan dipakai oleh seluruh komponen UI.

- **File & Modul**:
  - `src/app/globals.css`: Konfigurasi variabel CSS (Finspire Emerald, Foxy Amber, Slate Dark/Light, Glassmorphism).
  - `src/app/layout.tsx`: Penyesuaian metadata PWA, theme-color, dan konfigurasi viewport.
  - `src/components/common/button.tsx`: Komponen tombol game interaktif dengan efek tekan (*haptic scale animation* via `motion`).
  - `src/components/common/modal.tsx`: Komponen dialog overlay animasi.
  - `src/lib/audio/sound-fx.ts`: Controller efek suara Web Audio (klik koin, opsi terpilih, sukses, error) dengan opsi *mute*.
- **Kriteria Selesai (DoD)**:
  - Token warna dan tema gelap/terang berfungsi mulus.
  - Komponen tombol dan modal dapat dirender tanpa error build atau lint.

---

### 🟩 Tahap 1: Client Data Layer & Offline-First Core
**Tujuan**: Membangun database lokal di browser (IndexedDB) dan Service Worker agar data bab serta aksi permainan tersimpan aman meski tanpa internet.

- **File & Modul**:
  - `src/lib/client-db/idb-schema.ts`: Inisialisasi database `finspire_local_db` (versi 1) dengan 4 object stores:
    1. `content_packs`: Cache immutable bab (Ch1, Ch2, manifest).
    2. `attempts`: State attempt lokal yang sedang dimainkan.
    3. `outbox_actions`: Antrean aksi yang belum terkirim ke server (`actionId`, `clientSequence`, `payload`).
    4. `local_projections`: Snapshot saldo kas, XP, bintang, dan streak untuk rendering UI seketika.
  - `src/lib/client-db/outbox-manager.ts`: Fungsi atomik untuk mencatat aksi ke outbox dan memperbarui saldo provisional lokal.
  - `src/lib/sync/sync-coordinator.ts`:
    - Mengelola pengiriman batch ke `POST /api/v1/sync`.
    - Menggunakan `navigator.locks` (*single-flight lock*) agar multi-tab tidak melakukan sinkronisasi ganda.
    - Menangani status konektivitas (`online`, `offline`, `syncing`, `needs-auth`).
  - `public/manifest.json` & `public/sw.js`: Service worker untuk precaching app shell dan caching rilis konten immutable.
  - `src/app/sw-register.tsx`: Pemicu registrasi service worker yang aman dari SSR.
- **Kriteria Selesai (DoD)**:
  - Database IndexedDB berhasil dibuat di browser.
  - Menulis aksi ke outbox berhasil dan data tidak hilang saat halaman di-refresh.

---

### 🟩 Tahap 2: Autentikasi Pseudonim, Consent, & Onboarding
**Tujuan**: Membangun alur masuk siswa yang ramah privasi (Zero PII) tanpa email/password rumit.

- **File & Modul**:
  - `src/lib/stores/auth-store.ts`: Zustand store untuk menyimpan informasi sesi login, Player Code, dan status otentikasi.
  - `src/components/auth/consent-modal.tsx`: Modal persetujuan privasi ToS ramah remaja yang memanggil `POST /api/v1/consent/grant`.
  - `src/components/auth/credential-card.tsx`: Tampilan kartu berisi `Player Code` (`FOX-XXXX-XXX`) dan `Passphrase` acak dengan tombol salin.
  - `src/app/auth/register/page.tsx`: Halaman registrasi 1-klik yang memanggil `POST /api/v1/auth/pseudonymous/register`.
  - `src/app/auth/login/page.tsx`: Halaman login dengan validasi input Player Code & Passphrase serta penanganan proteksi brute-force (rate limiting).
- **Kriteria Selesai (DoD)**:
  - Siswa dapat mendaftar dengan satu klik, melihat Player Code-nya, dan cookie sesi `HttpOnly` aktif.
  - Siswa dapat logout dan login kembali menggunakan Player Code + Passphrase.

---

### 🟩 Tahap 3: Dashboard Utama & Peta Perjalanan (Chapter Hub)
**Tujuan**: Menghadirkan beranda permainan yang memotivasi siswa dengan indikator saldo, streak belajar, dan navigasi bab.

- **File & Modul**:
  - `src/components/dashboard/hud-header.tsx`:
    - Display Saldo Kas Simulasi (contoh: `Rp10.000` / `Rp300.000`).
    - Indikator **Streak Api Harian** (`🔥 3 Hari`).
    - Level, Bar XP, dan Total Bintang (`⭐`).
    - `src/components/common/sync-status-pill.tsx`: Indikator status jaringan (🟢 Tersinkron, 🟡 Offline - X aksi, 🔵 Menyinkronkan).
  - `src/components/dashboard/chapter-card.tsx`:
    - **Bab 1: KEEP IT ALIVE**: Status selalu terbuka default.
    - **Bab 2: PAY YOURSELF FIRST**: Terbuka otomatis setelah Bab 1 lulus; terkunci jika belum lulus.
  - `src/components/dashboard/cohort-banner.tsx`: Info kelas siswa & tombol cepat untuk memasukkan kode cohort 6-digit.
  - `src/app/page.tsx`: Integrasi seluruh komponen dashboard di halaman utama.
- **Kriteria Selesai (DoD)**:
  - Dashboard menampilkan data proyeksi aktual dari `GET /api/v1/bootstrap`.
  - Kartu Bab 2 menampilkan status terkunci/terbuka secara dinamis sesuai progres pemain.

---

### 🟩 Tahap 4: Engine Naratif & Dialog Interaktif (Visual Novel Reader)
**Tujuan**: Membangun antarmuka cerita interaktif tempat siswa membaca situasi, mendengarkan saran Foxy, dan mengambil keputusan finansial.

- **File & Modul**:
  - `src/lib/stores/gameplay-store.ts`: Zustand store untuk attempt aktif, scene berjalan, dan alokasi saldo berjalan.
  - `src/components/narrative/mascot-avatar.tsx`: Komponen visual maskot Foxy dengan ekspresi dinamis (senang, waspada, bingung, bangga).
  - `src/components/narrative/dialogue-box.tsx`: Balon dialog interaktif dengan efek teks muncul bertahap (*typewriter effect*) dan kontrol percepat tap.
  - `src/components/narrative/choice-list.tsx`: Tombol pilihan keputusan dengan transparansi biaya/keuntungan finansial.
  - `src/components/narrative/balance-pill.tsx`: Animasi melayang (+/- Rp) saat saldo berubah akibat pilihan.
  - `src/app/(game)/play/[chapterId]/page.tsx`: Halaman runner adegan bab yang memuat data cerita dari cache IndexedDB.
- **Kriteria Selesai (DoD)**:
  - Bab 1 adegan 1 sampai 7 dapat dimainkan berurutan.
  - Tiap pilihan langsung mengubah saldo di layar secara lokal dan mencatat aksi ke *Outbox*.

---

### 🟩 Tahap 5: Mini-Games Interaktif (Bab 1 & Bab 2)
**Tujuan**: Menyajikan mini-game edukatif penguat pemahaman konsep keuangan sebelum menghadapi Boss Challenge.

- **File & Modul**:
  - `src/components/minigames/quick-sort-game.tsx` (Bab 1: "Sortir Cepat"):
    - Siswa memilah 10 item pengeluaran harian (kebutuhan vs keinginan vs tabungan) dengan gesture geser/tap.
    - Tampilan skor akurasi (syarat lulus >= 70%).
  - `src/components/minigames/emergency-shield-game.tsx` (Bab 2: "Payung Dana Darurat"):
    - Simulasi pertahanan 3 gelombang guncangan pengeluaran mendadak (servis rem, iuran kertas ujian, obat sakit gigi).
    - Menampilkan daya tahan payung darurat tanpa mengorbankan pos kebutuhan pokok.
  - `src/app/(game)/play/[chapterId]/minigame/page.tsx`: Halaman perantara mini-game.
- **Kriteria Selesai (DoD)**:
  - Mini-game dapat diselesaikan di browser ponsel dengan kontrol sentuh yang responsif.
  - Hasil skor dikirimkan ke outbox dan diverifikasi oleh engine backend.

---

### 🟩 Tahap 6: Boss Challenge & Layar Kemenangan (Blueprint Synthesis)
**Tujuan**: Pengujian akhir setiap bab melalui formulir rencana keuangan mandiri dan selebrasi kelulusan.

- **File & Modul**:
  - `src/components/boss/blueprint-builder.tsx`:
    - **Bab 1 (Survival Plan)**: Memastikan saldo akhir pekan tetap positif dan bebas utang.
    - **Bab 2 (Financial Shield)**: Form interaktif formula **Pay Yourself First** (Tabungan 30%, Dana Darurat 15%, Kebutuhan Hidup 55%).
  - `src/components/boss/victory-celebration.tsx`:
    - Efek partikel konfeti (`canvas-confetti`).
    - Kartu Lencana Kelulusan (`BADGE-SURVIVOR` atau `BADGE-PLANNER`).
    - Ringkasan perolehan XP, koin, dan bintang.
  - `src/app/(game)/play/[chapterId]/boss/page.tsx`: Halaman arena tantangan boss.
- **Kriteria Selesai (DoD)**:
  - Siswa dapat menyusun alokasi dana dan mengirimkan rencana keuangan.
  - Saat lulus, efek selebrasi konfeti menyala dan Bab berikutnya di dashboard terbuka.

---

### 🟩 Tahap 7: Fitur Sekolah, Leaderboard Cohort, & Privasi
**Tujuan**: Mendukung ekosistem kelas dan memenuhi hak privasi data siswa secara penuh.

- **File & Modul**:
  - `src/components/dashboard/cohort-modal.tsx`: Modal input 6-digit kode akses untuk bergabung ke kelas guru (`POST /api/v1/schools/cohorts/join`).
  - `src/app/(game)/leaderboard/page.tsx`:
    - Papan peringkat kelas pseudonim (menampilkan rank, Player Code, bintang, XP, dan streak).
    - Proteksi akses BOLA (hanya siswa terdaftar yang dapat melihat).
  - `src/app/(game)/profile/page.tsx`:
    - Tombol *"Unduh Data Riwayat (JSON)"* memanggil `/api/v1/consent/export`.
    - Tombol *"Hapus Akun & Data Saya"* memanggil `/api/v1/consent/account`.
    - Pengaturan audio dan toggle dark/light mode.
- **Kriteria Selesai (DoD)**:
  - Siswa berhasil bergabung ke kelas dengan kode akses dan melihat namanya di leaderboard kelas.
  - Ekspor data JSON mengunduh riwayat lengkap siswa secara lokal.

---

### 🟩 Tahap 8: Audit, Testing E2E, PWA Offline Verification, & Polish
**Tujuan**: Memastikan aplikasi siap produksi, stabil pada koneksi buruk, dan lulus seluruh pengujian integrasi.

- **Aktivitas Verifikasi**:
  1. **Pengujian Offline PWA**:
     - Membuka aplikasi, login, mematikan jaringan (DevTools Network -> Offline), memainkan Bab 1 sampai selesai, lalu menyalakan jaringan kembali.
     - Memastikan seluruh antrean outbox tersinkron otomatis ke PostgreSQL tanpa kehilangan progres.
  2. **Multi-Tab Race Condition Test**:
     - Membuka dua tab browser sekaligus dan memicu sinkronisasi untuk memastikan Web Locks bekerja (*single-flight*).
  3. **Audit Tampilan Responsif**:
     - Uji coba viewport perangkat mobile (iPhone 12/14/15, Samsung Galaxy S20+, Xiaomi).
  4. **Build & Typecheck**:
     - Menjalankan `npm run typecheck` dan `npm run build` untuk memastikan nol error.
- **Kriteria Selesai (DoD)**:
  - Build produksi (`npm run build`) berhasil tanpa error lint/typecheck.
  - Seluruh alur perjalanan siswa dari registrasi hingga Bab 2 terbukti lancar di browser.

---

## 4. Matriks Ringkasan Eksekusi

| Tahap | Fokus Utama | Output Utama |
|---|---|---|
| **Tahap 0** | Design System & Common UI | Variabel CSS, tema gelap/terang, Button, Modal, Sound FX |
| **Tahap 1** | Offline Core & Client DB | IndexedDB Schema, Outbox Manager, Sync Coordinator, Service Worker |
| **Tahap 2** | Autentikasi & Onboarding | Register 1-klik, Kartu Player Code, Modal Consent ToS, Login |
| **Tahap 3** | Dashboard & Chapter Hub | Top HUD (Kas/XP/Streak), Kartu Bab 1 & 2 dinamis, Sync Pill |
| **Tahap 4** | Visual Novel Story Reader | Avatar Foxy dinamis, Balon Dialog, Pilihan Opsi, Saldo Realtime |
| **Tahap 5** | Mini-Games Interaktif | Mini-game "Sortir Cepat" (Ch1) & "Payung Darurat" (Ch2) |
| **Tahap 6** | Boss Challenge & Victory | Builder Alokasi Pay Yourself First, Konfeti, Lencana Kelulusan |
| **Tahap 7** | Fitur Sekolah & Privasi | Join Cohort 6-Digit, Leaderboard Pseudonim, Ekspor/Hapus Data |
| **Tahap 8** | E2E Testing & Polish | Verifikasi Offline PWA, Multi-tab Lock, Production Build |

---

*Roadmap bertahap ini siap dieksekusi mulai dari **Tahap 0**.*
