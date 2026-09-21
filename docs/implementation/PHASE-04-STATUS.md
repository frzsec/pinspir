# Status Implementasi Fase 04 — Auth, Privacy, dan Security

- **Status Dokumen**: `PROPOSED`
- **Tanggal Selesai**: 2026-09-21
- **Fase**: 04 - Autentikasi, Privasi, dan Keamanan
- **Otoritas Persetujuan**: Peninjau Manusia (Lead Architect / Project Owner)

---

## 1. Ringkasan Implementasi

Fase 04 mengimplementasikan seluruh mekanisme identitas pseudonim, session management, kontrol akses berbasis peran (RBAC), perlindungan Broken Object Level Authorization (BOLA), siklus hidup persetujuan (consent), dan penghapusan data (right to be forgotten) sesuai spesifikasi ADR-002, ADR-004, dan kontrak arsitektur:

1. **Kredensial Pseudonim Tanpa PII (`src/lib/auth/`)**:
   - `player-code.ts`: Generator Player Code dengan entropi tinggi (`FS-XXXX-XXXX` menggunakan alfabet Crockford Base32 tanpa karakter ambigu `I, O, 1, 0`), kanonikalisasi format dan validasi regex.
   - Menggunakan format alias RFC 2606 terisolasi (`<player_code_lower>@finspire.invalid`) yang tidak pernah membocorkan identitas siswa dan tidak membutuhkan verifikasi email/SMS eksternal.
   - `passphrase.ts`: Hashing kata sandi berbasis Node.js crypto `scrypt` dengan random salt 16-byte, parameter memori aman, dan perbandingan waktu-konstan (`timingSafeEqual`) untuk ketahanan terhadap timing attack.
   - `rate-limiter.ts`: In-memory sliding window rate limiter (maksimal 5 percobaan gagal per jendela 10 menit per identifier/IP) untuk mitigasi brute force dan enumeration resistance.
   - `session.ts`: Pengelolaan sesi token kriptografis 32-byte acak dengan kedaluwarsa 30 hari, atribut cookie produksi `HttpOnly`, `SameSite=Lax`, dan flag `Secure` dinamis.
   - `get-current-user.ts`: Helper resolusi sesi server-side dari cookie `finspire_session` dengan verifikasi tanggal kedaluwarsa database.

2. **Route Handlers Autentikasi & Privasi (`src/app/api/v1/`)**:
   - `POST /api/v1/auth/pseudonymous/register`: Registrasi mandiri akun siswa menghasilkan Player Code unik, hash kata sandi, inisialisasi entri proyeksi pemain (`player_projections`), pembuatan sesi otomatis, dan opsi langsung bergabung ke cohort sekolah via kode akses 6 karakter.
   - `POST /api/v1/auth/pseudonymous/login`: Autentikasi login berbasis Player Code + Passphrase dengan mitigasi enumerasi (waktu respon dan pesan error seragam), proteksi rate limiting, dan pembuatan cookie sesi baru.
   - `GET /api/v1/auth/pseudonymous/session`: Pengecekan sesi aktif pemain secara aman (`user_id`, `player_code`, `role`, `created_at`).
   - `POST /api/v1/auth/pseudonymous/logout`: Pencabutan sesi di database (`DELETE FROM sessions`) dan pembersihan cookie.
   - `POST /api/v1/schools/cohorts/join`: Pendaftaran siswa ke kelas cohort menggunakan kode akses 6 karakter yang divalidasi keaktifan dan masa berlakunya.
   - `GET /api/v1/schools/cohorts/:id/summary`: Ringkasan progres agregat cohort khusus guru pemilik (*teacher ownership verification* / pencegahan BOLA).
   - `POST /api/v1/schools/cohorts/:id/reset-credential`: Pemulihan kredensial siswa berbantuan guru dengan pencatatan audit lengkap di `credential_reset_audits`, hashing kata sandi baru, dan pencabutan seluruh sesi aktif siswa target secara otomatis.
   - `GET /api/v1/consent/status`: Pemeriksaan status riwayat persetujuan kebijakan privasi siswa.
   - `POST /api/v1/consent/grant` & `POST /api/v1/consent/revoke`: Pemberian dan pencabutan persetujuan pemrosesan data dengan pencatatan versi kebijakan, timestamp WIB, dan tujuan pemrosesan.
   - `GET /api/v1/consent/export`: Ekspor portabilitas data mandiri format JSON yang mencakup profil, proyeksi, riwayat reward, dan daftar consent (hanya data milik user terotentikasi).
   - `DELETE /api/v1/consent/account`: Penghapusan akun mandiri (*soft-delete* dengan menganonimkan Player Code menjadi `DELETED_<timestamp>`), pencabutan seluruh sesi, dan penghapusan data anggota cohort.
   - `ALL /api/auth/[...all]`: Handler jembatan Better Auth sesuai standar arsitektur.

---

## 2. Bukti Pengujian Integrasi Database Nyata (`finspire_test`)

Seluruh pengujian Fase 04 dijalankan terhadap basis data PostgreSQL lokal nyata tanpa mock objek database:

| No | Kasus Uji | Perintah | Hasil |
| :--- | :--- | :--- | :--- |
| 1 | **Pseudonymous Registration** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Akun dibuat, Player Code `FS-XXXX-XXXX`, email `...@finspire.invalid`, session cookie diterbitkan |
| 2 | **Pseudonymous Login & Session Recovery** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Login berhasil dengan kredensial valid, sesi baru diterbitkan dan divalidasi |
| 3 | **Enumeration Resistance & Wrong Passphrase** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Pesan error identik `INVALID_CREDENTIALS`, kode acak maupun kata sandi salah ditolak seragam |
| 4 | **Rate Limiter on Failed Logins** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: 5x percobaan gagal memicu `RATE_LIMIT_EXCEEDED` (HTTP 429) dengan header `Retry-After` |
| 5 | **Cohort Enrollment & Teacher BOLA Check** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Siswa bergabung via kode akses; guru non-pemilik ditolak dengan `FORBIDDEN` |
| 6 | **Teacher-Assisted Reset & Session Revocation** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Audit tercatat di `credential_reset_audits`, sesi lama dicabut, login dengan kata sandi baru sukses |
| 7 | **Consent Grant & Revocation Lifecycle** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Riwayat consent tercatat per versi, pencabutan merefleksikan status terkini |
| 8 | **Account Soft-Deletion & Session Purge** | `tsx --conditions=react-server --test tests/integration/auth.test.mjs` | **PASS**: Akun dianonymkan, seluruh sesi aktif terhapus, verifikasi sesi pasca-hapus mengembalikan `UNAUTHORIZED` |

---

## 3. Matriks Endpoint & Otorisasi RBAC

| Endpoint | Metode | Role Minimum | Mekanisme Proteksi & Audit |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/pseudonymous/register` | `POST` | Public | Rate limiting (IP/identifier), auto-create projection & session |
| `/api/v1/auth/pseudonymous/login` | `POST` | Public | Rate limiting (5 attempts/10m), anti-enumeration, scrypt verification |
| `/api/v1/auth/pseudonymous/session` | `GET` | Player | Validasi token cookie `finspire_session`, cek expiry di PostgreSQL |
| `/api/v1/auth/pseudonymous/logout` | `POST` | Player | Hapus sesi aktif dari database dan hapus cookie di client |
| `/api/v1/schools/cohorts/join` | `POST` | Player | Validasi kode akses 6 digit, duplikasi ditolak via unique constraint |
| `/api/v1/schools/cohorts/:id/summary` | `GET` | Teacher | Strict BOLA: verifikasi guru pemilik cohort, data diagregasi tanpa PII |
| `/api/v1/schools/cohorts/:id/reset-credential` | `POST` | Teacher | Strict BOLA: verifikasi kepemilikan guru, catat audit log, cabut sesi target |
| `/api/v1/consent/status` | `GET` | Player | Mengambil riwayat consent milik pemain sendiri |
| `/api/v1/consent/grant` | `POST` | Player | Pencatatan versi kebijakan, timestamp WIB, dan flag granted |
| `/api/v1/consent/revoke` | `POST` | Player | Pencatatan pencabutan consent aktif |
| `/api/v1/consent/export` | `GET` | Player | Export portabilitas JSON hanya untuk data milik sendiri |
| `/api/v1/consent/account` | `DELETE` | Player | Soft-delete, anonymize player code, cabut seluruh sesi aktif |
