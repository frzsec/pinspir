# ADR-002: Otentikasi Pseudonim & Pemulihan Akun (Pseudonymous Auth & Recovery)

- **Status**: PROPOSED
- **Tanggal**: 2026-09-21
- **Pengambil Keputusan**: Tim Arsitektur Finspire

---

## 1. Konteks (Context)

Finspire ditujukan untuk murid sekolah dasar dan menengah di Indonesia (usia 10–17 tahun) yang bermain baik di laboratorium komputer sekolah maupun di gawai pribadi. Pengumpulan data pribadi (PII) seperti alamat email pribadi, nomor telepon WhatsApp, atau Nomor Induk Kependudukan (NIK) memiliki risiko hukum berat terhadap kepatuhan perlindungan privasi anak (UU PDP No. 27/2022) dan menimbulkan friksi pendaftaran yang tinggi bagi murid yang belum memiliki akun email pribadi.

Namun demikian, sistem membutuhkan identitas akun yang tahan lama (*durable identity*) agar:
1. Murid dapat melanjutkan progres bermain di hari berikutnya pada perangkat komputer laboratorium yang berbeda.
2. Murid dapat terdaftar secara resmi di kelas/sekolah tertentu (*cohort*).
3. Guru dapat memantau capaian literasi muridnya tanpa mengetahui identitas rahasia murid di luar kelas.
4. Akun dapat dipulihkan jika murid melupakan kata sandinya.

---

## 2. Evaluasi Opsi Arsitektur (Architecture Options Evaluation)

Kami mengevaluasi 3 pendekatan integrasi otentikasi di atas pustaka **Better Auth**:

### Opsi 1: Akun Pseudonim Tahan Lama dengan Alias Teknis (`.invalid`) [REKOMENDASI TERPILIH]
- **Mekanisme**:
  - Murid diberikan **Player Code** unik berkombinasi tinggi (format: `FOX-XXXX-YYY`, e.g., `FOX-7K9M-2P4`) dan menentukan **Passphrase** sederhana (kata rahasia / frasa 4 kata ramah anak).
  - Di dalam skema Better Auth bawaan yang mewajibkan kolom `email` berformat alamat valid, sistem memetakan Player Code ke alias domain reserved IETF RFC 2606: `<player_code_lowercase>@finspire.invalid`.
  - Passphrase di-hash menggunakan algoritma Argon2id.
  - Sesi diterbitkan menggunakan cookie HTTP-only berdurasi 30 hari.
- **Pemulihan Akun (Recovery)**:
  - Tanpa email/telepon, pemulihan dilakukan secara **Terbimbing Guru (*Teacher-Assisted Recovery*)** di dalam kelas.
  - Guru pengampu kelas (*cohort teacher*) memiliki antarmuka untuk menerbitkan passphrase sementara baru bagi murid di kelasnya.
  - Setiap tindakan reset dicatat secara permanen di tabel `credential_reset_audits`.

### Opsi 2: Anonymous-First lalu Menautkan ke Kredensial Tahan Lama (*Account Linking*)
- **Mekanisme**: Klien membuat sesi anonim lokal berbasis UUID instalasi. Jika murid ingin berpindah perangkat, murid baru diminta mendaftarkan Player Code dan menghubungkan akun.
- **Kelemahan**: Risiko tinggi data hilang (*orphan account*) jika murid lab sekolah membersihkan cache browser sebelum menautkan akun; membingungkan alur pengelompokan kelas oleh guru di hari pertama sesi pembelajaran.

### Opsi 3: Custom Credential Provider Murni Tanpa Better Auth
- **Mekanisme**: Membangun tabel `users`, tabel `sessions`, verifikasi cookie, dan hashing manual dari nol.
- **Kelemahan**: Meningkatkan beban pemeliharaan keamanan (manajemen rotasi session token, proteksi timing attack, CSRF mitigation), membuang keuntungan ekosistem Better Auth yang kaya fitur.

---

## 3. Keputusan (Decision)

Kami memilih **Opsi 1: Akun Pseudonim Tahan Lama (Player Code + Passphrase) di atas Better Auth**:
1. Kolom internal `email` pada Better Auth diisi dengan format `${playerCode.toLowerCase()}@finspire.invalid`. Domain `.invalid` menjamin tidak ada lalu lintas email keluar yang pernah terkirim secara keliru.
2. Otentikasi guru dapat menggunakan email kerja resmi (`guru@sekolah.sch.id`), sedangkan akun murid 100% menggunakan alias pseudonim.
3. Alur pemulihan akun murid menggunakan mekanisme **Teacher-Assisted Credential Reset** yang terikat otorisasi kelas (`cohort_members.cohort_id`), mencegah akses guru luar terhadap murid sekolah lain.

---

## 4. Konsekuensi (Consequences)

- **Positif**:
  - Nol pengumpulan PII murid; kepatuhan privasi anak terjamin secara teknis (*privacy by default*).
  - Murid tidak perlu memiliki smartphone, kartu SIM, atau akun Google/email untuk belajar.
  - Skema database Better Auth standar tetap terjaga tanpa memodifikasi pustaka eksternal.
- **Negatif / Keterbatasan**:
  - Jika murid independen (bukan bagian dari kelas sekolah) kehilangan Player Code dan Passphrase sekaligus, akun **TIDAK DAPAT DIPULIHKAN** dari jarak jauh karena tidak ada kanal komunikasi luar (email/SMS). Hal ini harus diperingatkan secara jelas di UI saat pendaftaran.
- **Netral**:
  - Guru memegang tanggung jawab verifikasi fisik murid sebelum mereset sandi di kelas.

---

## 5. Dampak Keamanan & Privasi (Security & Privacy Impact)

- Proteksi brute-force: Rate limit ketat (5 kegagalan per IP per 10 menit).
- Entropi Player Code: Pola `FOX-XXXX-YYY` menghasilkan ruang kombinasi > 268 juta kemungkinan, mencegah enumerasi berurutan.
- Audit transparansi: Seluruh reset kata sandi oleh guru tercatat di log audit dengan stempel waktu dan ID guru pelaksana.

---

## 6. Migrasi & Rollback (Migration & Rollback Strategy)

- Skema dirancang sejak awal pada Fase 03 dan diimplementasikan pada Fase 04.
- Jika di masa mendatang sekolah menginginkan integrasi Single Sign-On (SSO) Google Workspace for Education, Better Auth mendukung penautan akun (*account linking*) OAuth ke akun pseudonim yang sudah ada tanpa kehilangan progres.

---

## 7. Bukti & Referensi (Evidence & References)

- IETF RFC 2606: *Reserved Top Level DNS Names (`.invalid` for non-routable entities)*.
- Better Auth Documentation: *Credentials Provider & Custom User Schema Mapping*.
- Undang-Undang Perlindungan Data Pribadi Republik Indonesia (UU No. 27 Tahun 2022).
