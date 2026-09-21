# Kontrak Bersama Implementasi Finspire

Dokumen ini wajib dibaca sebelum setiap prompt fase. Kata **WAJIB**, **DILARANG**, dan **STOP** adalah acceptance constraint, bukan saran.

## 1. Objective dan batas pilot

Bangun **Finspire production pilot**: PWA permainan cerita literasi keuangan untuk sosialisasi sekolah, dengan pengguna awal diprioritaskan pada usia 16–17 tahun dalam rentang target 16–24 tahun. Pilot harus benar-benar menyimpan, memulihkan, dan menyinkronkan progres; bukan sekadar prototype atau demo visual.

Scope konten playable awal adalah Chapter 1–2 sesuai roadmap MVP. Chapter 3–5, monetisasi, pembayaran, iklan, dan parent dashboard penuh tetap future scope kecuali ada keputusan tertulis baru. Arsitektur tidak boleh menutup jalan untuk ekspansi tersebut.

UI final, motion final, dan penerjemahan Figma ke kode **belum termasuk scope** paket ini. Pertahankan UI yang ada. Technical shell minimal diperbolehkan hanya untuk observability atau E2E. Kontrak animasi harus mengakomodasi WebM transparan yang akan diberikan kemudian, dengan fallback poster PNG/WebP dan reduced-motion.

## 2. Urutan sumber kebenaran

Jika sumber bertentangan, gunakan urutan berikut:

1. Keputusan terbaru pengguna yang tertulis dan approval gate.
2. Kontrak bersama ini serta ADR/content release yang sudah berstatus `APPROVED`.
3. `../PRD Finspire v3.0.docx` sebagai sumber canonical visi produk, desain chapter, mastery, artifact, identity progression, dan persistent story.
4. `../Finspire UIUX Storyboard Interaction Spec v1.0.pdf` sebagai kontrak alur layar/interaksi; dokumen ini tidak boleh mengubah makna chapter canonical.
5. `../prdterbaru.md` sebagai mirror Markdown dari PRD canonical agar mudah dibaca agent.
6. `../REFERENSI PRESENTASI & PENJELASAN IDE.md` untuk batas klaim dan inkonsistensi yang sudah diketahui.
7. `../FINSPIRE PRESENTATION.pdf` dan guideline lomba sebagai konteks presentasi/bisnis.
8. Kode dan lockfile aktual sebagai kebenaran versi teknis yang terpasang.

Jika DOCX dan mirror Markdown berbeda secara material, DOCX menang dan perbedaannya wajib dilaporkan. Storyboard bukan naskah cerita final. Dokumen itu sendiri menyebut detail scene per hari/episode perlu dibuat di story script terpisah. Jangan mengubah ringkasan menjadi fakta final tanpa label asumsi dan approval.

PRD canonical masih dapat memiliki konflik internal. Khususnya, jangan diam-diam menebak penyelesaian konflik Chapter 5 vs roadmap, lima chapter vs level/data model empat chapter, mastery unlock vs streak unlock, aktivitas Chapter 4 di dunia nyata vs simulasi, atau angka Chapter 2 yang belum direkonsiliasi. Catat sebagai decision/gap sampai disetujui.

Contoh versi teknologi, format aset, layanan SaaS, atau mekanisme identitas di PRD tidak mengalahkan keputusan pengguna terbaru, kontrak ini, dan kondisi repository. Baseline implementasi tetap offline-first, tanpa layanan berbayar, self-hosted bila layak, identitas pseudonim untuk pilot, dan kontrak maskot WebM transparan.

Spreadsheet survei mentah di parent directory mengandung data pribadi. **DILARANG** menyalin, mengimpor, seed, commit, atau mencetak isinya ke log. Hanya statistik agregat yang sudah disetujui boleh digunakan.

## 3. Baseline teknis

- Repository: Next.js App Router, TypeScript strict, React, Tailwind, Zustand, Motion.
- Ikuti versi nyata di `package.json`/lockfile; saat kontrak ini dibuat Next.js adalah 16.3.5, bukan contoh versi 15 yang masih tertulis di PRD canonical.
- Baca `AGENTS.md` dan dokumentasi Next.js lokal yang dirujuknya sebelum mengubah kode framework.
- Server tetap di aplikasi Next.js melalui Route Handlers untuk API versioned `/api/v1`. Jangan menambah server Express terpisah tanpa ADR baru.
- PostgreSQL adalah canonical source of truth. Gunakan Drizzle ORM dan migrasi version-controlled. Jangan mengganti tes integrasi dengan SQLite karena semantics concurrency/transaction berbeda.
- Zustand hanya untuk state presentasi/ephemeral; bukan sumber kebenaran progres, saldo, hadiah, atau hak akses.
- Zona waktu bisnis dan pelaporan pilot: `Asia/Jakarta`. Simpan timestamp sebagai UTC dan lakukan konversi secara eksplisit.
- Dependensi baru harus compatible dengan versi runtime aktual, dikunci dalam lockfile, memiliki alasan, dan tidak memerlukan paket berbayar.

## 4. Invariant produk dan data

1. Server menghitung dan mengesahkan semua consequence, saldo simulasi, XP, koin, achievement, unlock, dan completion. Client hanya mengirim tindakan/answer mentah beserta context yang diizinkan.
2. Nilai uang disimpan sebagai integer rupiah; tidak memakai floating point.
3. Setiap tindakan client mempunyai UUID, `installationId`, sequence monotonic per instalasi, `contentVersion`, dan waktu client sebagai metadata tidak tepercaya.
4. Retry tindakan yang sama mengembalikan hasil yang sama. Unique constraint dan transaksi database—bukan pengecekan aplikasi saja—mencegah hadiah ganda.
5. Keputusan pertama yang diterima untuk satu scene dalam attempt yang sama menang. Retry payload identik adalah duplicate sukses; payload berbeda untuk slot yang sudah terisi adalah conflict eksplisit.
6. Ledger reward append-only adalah dasar audit. Projection/cache pemain dapat dibangun ulang dari event/ledger yang canonical.
7. Content release bersifat immutable setelah dipublikasikan. Progress selalu menunjuk versi yang dimainkan; update konten membuat versi baru, bukan mengubah sejarah.
8. Offline action bersifat pending/untrusted sampai divalidasi server. Server boleh menerima, menolak, atau mengembalikan conflict beserta canonical snapshot.
9. Installasi/account tidak boleh saling mencampur outbox. Pergantian akun tidak pernah mengirim tindakan milik akun sebelumnya.
10. Semua branch konten harus berakhir secara valid dan setiap referensi ID harus dapat diselesaikan.

## 5. Kontrak offline-first

- Registrasi/login pertama, download content pack pertama, sinkronisasi, leaderboard, teacher dashboard, dan push subscription memerlukan jaringan.
- Setelah pemain berhasil login dan pack tersedia, Chapter pilot yang sudah diunduh harus dapat dibuka, dimainkan, ditutup/reload, dan dilanjutkan tanpa jaringan.
- Simpan content pack immutable, local projection, attempt, dan outbox di IndexedDB dengan schema version/migration. Jangan menyimpan password, passphrase, session cookie, bearer token, atau secret di IndexedDB/localStorage.
- Cookie sesi tetap `HttpOnly`, `Secure` di produksi, dan sesuai kebijakan `SameSite` yang dipilih ADR.
- Sesi server yang kedaluwarsa tidak boleh menghapus aksi offline. Queue dikarantina sampai **akun yang sama** login kembali. Account switch tidak boleh melihat atau mengirim queue akun lain.
- Explicit logout harus memperingatkan bila ada pending action; setelah keputusan pengguna, bersihkan data privat lokal milik akun tersebut agar aman pada perangkat sekolah bersama.
- Gunakan outbox eksplisit dan sync coordinator. Flush saat app start, event `online`, kembali fokus/visible, tombol retry manual, dan Background Sync bila browser mendukung. Background Sync adalah enhancement, bukan satu-satunya mekanisme.
- Cache shell dan aset publik dengan strategi sesuai jenis aset. API privat/auth/sync harus network-only dan tidak masuk Cache Storage. Jangan memakai wildcard cache untuk seluruh `/api`.
- Service worker update tidak boleh menghapus IndexedDB/outbox. Tangani migrasi, quota, eviction, content pack rusak, serta storage persistence sebagai kondisi nyata.

## 6. Identitas, privasi, dan sekolah

- Tidak boleh mewajibkan email asli, nomor telepon, OAuth, kartu pembayaran, atau layanan OTP berbayar untuk pemain pilot.
- Target UX identitas adalah akun pseudonim dengan **Player Code + passphrase** yang dapat dipakai lintas perangkat. Implementasi internal melalui Better Auth harus diputuskan di ADR; jangan mencampur model anonymous-only dan durable credential tanpa migration/linking yang jelas.
- Tidak ada password recovery via email pada baseline tanpa-PII. Dokumentasikan teacher-assisted reset/rotasi credential yang aman, audit, dan keterbatasannya.
- Modelkan school/cohort membership, role minimal `player`, `teacher`, `admin`, consent/assent record, retention, export, dan deletion. Kumpulkan data seminimal mungkin.
- Teacher hanya melihat cohort yang menjadi kewenangannya dan data agregat/minimal yang diperlukan. Leaderboard harus opt-in, memakai display alias, dan tidak membuka identitas siswa.
- Jangan mengklaim “sudah patuh hukum” hanya karena fitur dibuat. Simpan requirement hukum sebagai kontrol yang dapat ditinjau; pemrosesan data anak memerlukan perhatian dan persetujuan orang tua/wali sesuai keputusan pilot.
- Log, analytics, error message, dan telemetry tidak boleh berisi passphrase, cookie, token, body auth, atau PII mentah.

## 7. API dan kualitas

- Semua endpoint produk baru berada di `/api/v1`; format error konsisten dan memiliki request/correlation ID.
- Parse dan validasi semua input di boundary. Batasi payload, pagination, rate, serta ukuran batch sync.
- Authorization selalu diperiksa server-side per resource, bukan hanya role global atau hidden UI.
- Health contract membedakan liveness dan readiness. Readiness memeriksa dependency kritis tanpa membocorkan detail rahasia.
- Tes minimal mencakup unit domain, integration dengan PostgreSQL nyata, contract/schema API, dan E2E browser untuk offline. Tes harus deterministic; clock, UUID, dan random dapat diinjeksi.
- Jangan menonaktifkan lint/type safety, menelan error, atau mengganti implementasi dengan mock pada production path agar tes hijau.
- Jangan mengklaim kapasitas, keamanan, legal compliance, atau impact learning tanpa bukti pengujian.

## 8. Batas biaya dan operasi

- Gunakan software open-source/self-hosted dan fasilitas VPS yang tersedia. Jangan menambahkan SaaS berbayar, trial yang akan habis, email/SMS berbayar, object storage wajib, atau ketergantungan kartu kredit.
- Web Push memakai kemampuan browser/VAPID self-hosted dan harus feature-flagged. Analytics first-party/minimal lebih diprioritaskan; Umami boleh dipasang terpisah hanya jika resource VPS memadai dan ada keputusan operasi.
- Secret hanya melalui environment/secret store VPS. Commit hanya `.env.example` tanpa nilai nyata.
- Backup di disk VPS yang sama bukan backup yang cukup. Runbook harus menyediakan salinan terenkripsi ke media/lokasi lain yang dikendalikan tim, meski langkah awalnya manual.

## 9. Definisi approval dan STOP

`APPROVED` hanya sah jika diberikan manusia/Codex setelah meninjau handoff. Status yang dibuat Antigravity sendiri adalah `PROPOSED`.

Antigravity wajib **STOP tanpa improvisasi** jika:

- artefak fase sebelumnya belum ada, masih `PROPOSED`, atau punya blocking decision;
- sumber yang diperlukan tidak dapat dibaca;
- pilihan akan mengubah scope, model identitas, conflict semantics, data anak, atau biaya;
- ada perubahan user lain yang tumpang tindih dan tidak aman digabung;
- migration berpotensi merusak data tanpa backup/rollback;
- butuh secret, akses VPS, domain, atau approval eksternal yang belum tersedia;
- konten/rubrik yang diperlukan belum disetujui;
- PostgreSQL nyata dibutuhkan untuk acceptance tetapi tidak tersedia.

Saat STOP, tetap lakukan pemeriksaan read-only yang aman, tulis blocker dengan opsi dan rekomendasi, lalu jangan berpura-pura gate lulus.

## 10. Disiplin perubahan dan handoff

- Inspeksi dulu; jangan menimpa perubahan pengguna atau melakukan reset/destructive command.
- Batasi diff pada fase aktif. Jangan mengerjakan UI final atau fase berikutnya “sekalian”.
- Jangan commit atau push kecuali pengguna secara eksplisit memintanya setelah review gate.
- Repository memakai npm. Pada Windows PowerShell, gunakan `npm.cmd` bila execution policy menghalangi `npm`; jangan mengganti package manager atau meregenerasi lockfile tanpa alasan.
- Catat asumsi, keputusan, dan status approval dalam artefak yang ditentukan prompt.
- Jalankan semua verifikasi yang relevan dan tulis command, exit code, serta ringkasan hasil sebenarnya.
- Akhiri dengan laporan yang mengikuti [`HANDOFF_TEMPLATE.md`](./HANDOFF_TEMPLATE.md), `git status --short`, dan `git diff --stat`.
- Jika ada tes yang tidak dijalankan, tulis alasan dan dampaknya. “Belum dijalankan” tidak sama dengan “lulus”.
