# Prompt Fase 04 — Auth, Privacy, dan Security

Jalankan hanya setelah Fase 03 disetujui.

---

Kamu bekerja di repository `finspire`. Implementasikan identitas pseudonim yang tahan lintas sesi/perangkat, authorization sekolah, consent, dan kontrol privacy/security sesuai ADR. Jangan mengubah model identitas berdasarkan preferensi pribadi.

## Preflight wajib

1. Baca `docs/antigravity/00-shared-contract.md`, ADR auth/security, data model, OpenAPI, threat model, dan seluruh hasil Fase 03.
2. Pastikan status content, architecture, dan Fase 03 `APPROVED`, seluruh migration/test baseline lulus, serta tidak ada blocking auth spike.
3. Baca `AGENTS.md` dan dokumentasi Next.js lokal. Verifikasi API Better Auth terhadap dokumentasi resmi untuk versi yang akan dikunci; jangan menyalin contoh lama.
4. Jalankan `git status --short`, baseline tests, dan fresh migration sebelum mengubah kode.

Jika ADR auth belum memilih satu model yang dapat dibuktikan, STOP dengan spike report. Jangan menggabungkan anonymous-only dan durable credentials secara ad hoc.

## Outcome wajib

Pemain dapat melakukan registrasi/login pertama secara online memakai UX **Player Code + passphrase**, tanpa email/telepon asli atau layanan OTP. Akun tetap dapat dipakai lintas perangkat. Teacher/admin mempunyai role terbatas, dan alur consent/recovery/privacy dapat diaudit.

## Implementasi

### A. Better Auth dan credential pseudonim

- Implementasikan persis strategi ADR yang disetujui.
- Bila ADR memakai identifier internal/technical alias, gunakan domain reserved `.invalid`, jangan kirim email, jangan tampilkan alias internal, dan buktikan integration test terhadap Better Auth. Jangan menyimpan passphrase sendiri di luar hashing/library auth.
- Player Code harus high-entropy, non-sequential, case/format normalization jelas, tidak mengandung data siswa, dan dapat diketik/dicetak dengan checksum atau ambiguity guard bila ADR menetapkan.
- Jangan bocorkan apakah Player Code ada melalui response/timing yang mudah dieksploitasi.
- Terapkan passphrase policy yang layak untuk remaja tanpa security theater; simpan hanya hash oleh library teruji.
- First registration/login/recovery selalu online. Offline play tidak memvalidasi credential lokal dan tidak menyimpan password/token di IndexedDB/localStorage.
- Session cookie production `HttpOnly`, `Secure`, dan `SameSite` sesuai ADR; rotasi/revoke/session expiry teruji.

### B. Enrollment dan recovery sekolah

- School/cohort invite/access code bersifat scoped, expiration-aware, usage-limited, disimpan hashed bila bersifat secret, dan rate-limited.
- Teacher-assisted recovery merotasi credential/reset token tanpa memungkinkan teacher membaca passphrase lama atau mengambil alih akun diam-diam.
- Semua grant role, invite, reset, revoke, dan enrollment sensitif tercatat di audit log dengan actor/target/time/reason tanpa secret.
- Tidak ada akun/default password produksi di seed.
- Jangan mengklaim email recovery tersedia pada baseline tanpa-PII.

### C. Consent dan pembatasan fitur

- Implementasikan versioned consent/assent record sesuai keputusan pilot: policy version, actor/relationship yang dibutuhkan, granted/revoked time, evidence reference minimal, dan purpose.
- Middleware/service authorization harus menahan fitur yang mensyaratkan consent; hidden button bukan kontrol.
- Consent revocation menghentikan pemrosesan baru yang tidak punya dasar lain dan masuk flow deletion/retention yang terdokumentasi.
- Jangan mengumpulkan tanggal lahir presisi jika band usia atau mekanisme operasional yang lebih minimal sudah cukup.

### D. Authorization/RBAC

- Role minimal `player`, `teacher`, `admin`; default deny.
- Semua resource check memakai ownership/school/cohort relationship server-side.
- Teacher hanya dapat mengakses cohort yang ditugaskan dan hanya field yang diizinkan.
- Admin capability dipisahkan dari teacher dan tidak diberikan lewat client input.
- Buat negative tests untuk IDOR/BOLA pada profile, progress, cohort, export, delete, invite, recovery, dan future leaderboard.

### E. Security boundary

- Validasi input/output di boundary dan gunakan error catalog tanpa stack/internal IDs yang tidak perlu.
- Terapkan Origin/CSRF protection sesuai mekanisme cookie dan Better Auth; CORS default same-origin kecuali ADR eksplisit.
- Rate limit/self-hosted abuse control untuk login, registration, code redemption, recovery, export, dan deletion. Jangan bergantung pada IP saja dan dokumentasikan trade-off satu VPS/proxy.
- Batasi body size, normalize identifier dengan aman, gunakan constant behavior sejauh praktis, dan pasang trusted proxy/host configuration.
- Redact cookie, authorization header, passphrase, code, token, dan body auth dari logs.
- Jangan membuat CSP/security header yang mematahkan Next/PWA; selaraskan dengan threat model dan test.

### F. Privacy API

Implementasikan kontrak versioned untuk:

- session/bootstrap identity minimal;
- profile pseudonim;
- consent status/grant/revoke sesuai role;
- export data milik sendiri dalam format machine-readable;
- request/execute account deletion sesuai retention policy;
- teacher school/cohort/invite/recovery operations yang disetujui.

Export/deletion harus authorize ulang untuk aksi berisiko, idempotent, tidak mengekspos user lain, dan mempunyai audit trail. Deletion merevoke session serta mendefinisikan apa yang dihapus, dianonimkan, atau dipertahankan dan alasannya. Jangan klaim legal compliance final.

### G. Test wajib

Gunakan PostgreSQL nyata untuk integration test. Minimal uji:

- registrasi pseudonim, login, logout, restart process, login perangkat kedua;
- Player Code duplicate/normalization, wrong passphrase, enumeration resistance secara fungsional;
- session expiry/revoke/cookie attributes production;
- invite expired/reused/wrong cohort/concurrent redemption;
- brute-force/rate-limit dan recovery replay;
- player vs player, teacher vs cohort lain, teacher vs admin endpoint;
- consent missing/granted/revoked dan version upgrade;
- export hanya data sendiri, deletion idempotent, session mati sesudah delete;
- log capture membuktikan secret/PII sensitif tidak tercetak;
- CSRF/bad origin, oversized/malformed payload, SQL-like input;
- migration dari Fase 03 dan rollback/compatibility sesuai rencana.

Jangan memakai mocks untuk membuktikan cookie, database constraint, atau cross-user authorization.

## Dokumentasi/output

- Sinkronkan OpenAPI/error catalog/ERD dengan implementasi tanpa mengubah semantics approved.
- Dokumentasikan account lifecycle, teacher-assisted recovery, consent operations, retention/deletion, incident revoke, dan limitasi tanpa-email.
- Buat `docs/implementation/PHASE-04-STATUS.md` berstatus `PROPOSED` dan requirement-test evidence.

## Batas fase

Jangan membuat UI final, OAuth/social login, email/SMS delivery, payment, parent dashboard, offline credential store, game engine, service worker, atau deployment live. Technical test endpoint hanya boleh ada di environment test dan tidak masuk production build.

## Acceptance gate

Jalankan validator terdahulu, lint, typecheck, unit/integration/security-negative tests, fresh migrate+seed, production build, `git diff --check`, secret/PII scan, status, dan diff stat. Status hanya layak `REVIEW REQUIRED` jika seluruh auth lifecycle dan authorization test lulus dengan PostgreSQL nyata.

Jika provider tidak dapat memenuhi UX/keamanan ADR tanpa workaround rapuh, STOP, tulis bukti dan opsi revisi ADR; jangan menyamarkan dengan mock.

## Handoff

Ikuti `docs/antigravity/HANDOFF_TEMPLATE.md`. Tambahkan auth-flow diagram, endpoint/role matrix, data inventory yang benar-benar tersimpan, cookie/rate-limit evidence, deletion behavior, dan limitation recovery. Jangan lanjut ke Fase 05.

---

