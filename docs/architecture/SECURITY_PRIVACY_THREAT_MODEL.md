# Model Ancaman Keamanan & Privasi (Security & Privacy Threat Model)

Dokumen ini memetakan model ancaman berbasis STRIDE, inventaris data, kontrol proteksi privasi, dan mitigasi risiko operasional untuk platform edukasi Finspire pada lingkungan sekolah dan perangkat bersama (*shared devices*).

---

## 1. Matriks Ancaman (Threat Matrix)

| ID | Aset Terancam | Aktor Ancaman | Skenario Penyalahgunaan (Abuse Case) | Dampak (Impact) | Kontrol Proteksi (Mitigasi) | Verifikasi & Pengujian |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **THREAT-01** | Kredensial Murid (`player_code`, `cohort_code`) | Penyerang Eksternal / Murid Iseng | Brute-force & enumerasi Player Code atau Kode Kelas untuk membajak akun teman sekelas. | Akses tidak sah ke progres akun, perubahan status bermain. | 1. Rate limiter ketat pada `/api/v1/auth/pseudonymous/*` (maks 5 kali gagal per IP/subnet per 10 menit).<br>2. Format Player Code berkombinasi tinggi (`FOX-XXXX-YYY`, entropi ~28-bit).<br>3. Argon2id hashing untuk passphrase. | Uji penetrasi otomatis brute-force; verifikasi status HTTP 429 dan delay eksponensial. |
| **THREAT-02** | Sesi Pengguna (`session_token`) | Man-in-the-Middle / Skrip XSS Lokal | Pencurian token sesi atau session fixation via perangkat bersama atau jaringan Wi-Fi publik sekolah. | Pembajakan identitas murid/guru tanpa otorisasi. | 1. Cookie HTTP-only, `Secure`, `SameSite=Lax`, anti-CSRF token.<br>2. HSTS aktif di Nginx reverse proxy.<br>3. Content Security Policy (CSP) ketat tanpa `unsafe-inline` untuk skrip pihak ketiga. | Uji CSP evaluator, audit header cookie via DevTools, tes simulasi CSRF cross-origin. |
| **THREAT-03** | Data Cohort & Nilai Kelas | Guru Jahat / Murid Menebak ID | Broken Object-Level Authorization (BOLA / IDOR): Guru A mengakses data analitik kelas milik Guru B via parameter URL. | Kebocoran data agregat capaian kelas lain. | 1. Otorisasi berbasis baris (*row-level authorization*) di controller/ORM.<br>2. Verifikasi kepemilikan `cohort.teacher_id == session.user_id` di setiap query mutasi/baca.<br>3. UUID v4 non-sekuensial. | Tes integrasi multi-guru (Guru A meminta endpoint ringkasan kelas Guru B -> respon wajib 403/404). |
| **THREAT-04** | Ledger Hadiah & Bintang XP | Murid Mengedit Penyimpanan Lokal | Replay/tamper aksi offline: Murid menyalin request sync HTTP yang sukses dan mengirimkannya 100x untuk melipatgandakan reward (farming). | Inflasi nilai XP dan perusakan integritas papan peringkat kelas. | 1. Ledger append-only dengan *unique constraint*: `UNIQUE(user_id, release_id, source_node_id, reward_type)`.<br>2. Evaluasi konsekuensi hanya dilakukan server.<br>3. Request duplikat mengembalikan `status: "duplicate"` tanpa mengeksekusi ulang reward. | Tes idempotensi: Kirim batch sync identik 5x, pastikan total reward di DB bertambah tepat 1x. |
| **THREAT-05** | Riwayat Bermain Lokal | Murid Berikutnya di PC Lab Sekolah | Murid B menggunakan PC lab yang sama setelah Murid A selesai bermain tanpa logout bersih, melihat riwayat sesi sebelumnya. | Pelanggaran ekspektasi privasi antar sesama murid. | 1. PWA auto-lock / clear memori aktif setelah inaktivitas 15 menit.<br>2. Tombol "Keluar Bersih" (*Clean Sign Out*) yang membersihkan token memori, CacheStorage privat, dan mengunci outbox IndexedDB.<br>3. Karantina data lokal per ID instalasi. | Tes skenario laboratorium: Login Murid A -> Sign Out -> Login Murid B; pastikan Murid B tidak melihat data Murid A. |
| **THREAT-06** | Kapasitas Server VPS | Botnet / Klien Malfungsi | Pengiriman batch sync berukuran raksasa (ribuan aksi per batch) atau frekuensi tak terbatas yang menyebabkan DoS (*Denial of Service*). | Server kehabisan CPU/RAM, PostgreSQL mengalami thread exhaustion, layanan lumpuh. | 1. Pembatasan ukuran payload JSON di Nginx (`client_max_body_size 1M`).<br>2. Pembatasan jumlah aksi: Maksimal 50 aksi per request batch sync.<br>3. Rate limit sync: Maks 30 request/menit per session. | Tes fuzzing payload sync > 1MB dan batch berisi 51 aksi; verifikasi penolakan dengan error 413/422. |
| **THREAT-07** | Narasi & Aturan Konten | Modifikasi File Lokal | Murid mengubah file skrip bab JSON di IndexedDB untuk meloloskan mastery check secara otomatis. | Pemain memalsukan kelulusan chapter. | 1. Engine server memvalidasi ulang seluruh urutan pilihan berdasarkan konten kanonikal yang tersimpan di server.<br>2. Klien hanya mengirim `sceneNodeId` dan `choiceId`, bukan hasil skor. | Tes manipulasi jawaban klien; server mengevaluasi ulang pohon keputusan dan menolak nilai palsu. |
| **THREAT-08** | File Log & Backup VPS | Akses Root / Operator Server | Log aplikasi atau berkas dump database bocor ke publik atau memuat data sensitif tanpa enkripsi. | Kredensial dan data analitik bocor keluar lingkungan terisolasi. | 1. Redaksi log otomatis: Token, passphrase, dan cookie disensor menjadi `[REDACTED]`.<br>2. Backup terenkripsi gpg/age di volume lokal terisolasi.<br>3. Log rotasi lokal tanpa pengiriman ke log aggregator pihak ketiga komersial. | Audit output log saat proses login dan sync; pastikan tidak ada plaintext passphrase atau session token. |
| **THREAT-09** | Mekanisme Ekspor & Penghapusan | Penyerang dengan Token Curian | Penggunaan endpoint ekspor/penghapusan akun massal untuk sabotase data murid. | Kehilangan data progres murid secara permanen. | 1. Penghapusan akun memerlukan konfirmasi sandi ulang.<br>2. Grace period 7 hari sebelum penghapusan fisik (*soft-delete* berstatus `pending_deletion`).<br>3. Rate limit ekspor data (maks 1 ekspor per akun per 24 jam). | Tes request ekspor ganda dalam 24 jam (kedua harus 429); verifikasi grace period soft-delete. |
| **THREAT-10** | Service Worker & Aset Web | Cache Tampering / MITM Lokal | Service Worker menyimpan berkas JS berbahaya atau terjadi kegagalan pembaruan aset (*stale cache loop*). | Klien mengeksekusi kode usang atau kode yang terinfeksi. | 1. File Service Worker (`sw.js`) disajikan dengan header `Cache-Control: no-cache, no-store, must-revalidate`.<br>2. Hash integritas pada tag skrip HTML.<br>3. Mekanisme skip-waiting dengan konfirmasi pengguna yang teruji. | Verifikasi cache invalidation saat rilis versi PWA baru; pastikan `sw.js` selalu diperiksa ke jaringan. |

---

## 2. Inventaris Data, Tujuan, & Prinsip Minimasi

Finspire mengusung prinsip **Privacy by Design & Default** untuk melindungi pengguna di bawah umur (usia sekolah dasar/menengah):

```
+-------------------------------------------------------------------------------+
|                      INVENTARIS DATA PENGGUNA FINSPRE                        |
+-------------------+----------------------+--------------------+---------------+
| Kategori Data     | Elemen Data          | Tujuan Pengolahan  | Retensi       |
+-------------------+----------------------+--------------------+---------------+
| Identitas Murid   | - Player Code (Acak) | Otentikasi dan     | Selama akun   |
|                   | - Display Nickname   | identifikasi kelas | aktif; dihapus|
|                   | - Avatar Config      | tanpa memuat nama  | 7 hari setelah|
|                   | - Argon2id Hash      | asli/NIK murid.    | permohonan.   |
+-------------------+----------------------+--------------------+---------------+
| Afiliasi Sekolah  | - School ID          | Agregasi capaian   | 1 tahun ajaran|
|                   | - Cohort Code        | belajar tingkat    | aktif (dapat  |
|                   | - Tahun Ajaran       | kelas dan sekolah. | diperpanjang).|
+-------------------+----------------------+--------------------+---------------+
| Telemetri Belajar | - Playthrough ID     | Evaluasi rubrik    | 6 bulan aktif;|
|                   | - Sequence Pilihan   | pedagogis dan      | agregasi      |
|                   | - Waktu Respons      | deteksi hambatan   | anonim setelah|
|                   | - Ledger Hadiah      | pemahaman materi.  | periode usai. |
+-------------------+----------------------+--------------------+---------------+
| Teknis & Sinkron  | - Installation UUID  | Manajemen outbox,  | Dihapus saat  |
|                   | - Push Subscription  | idempotensi sync,  | instalasi PWA |
|                   | - Versi Browser      | dan notifikasi PWA.| dibersihkan.  |
+-------------------+----------------------+--------------------+---------------+
```

### 2.1 Kebijakan Tanpa PII (Personally Identifiable Information)

1. **Tanpa Email & Nomor Telepon Wajib bagi Murid**: Pendaftaran murid tidak pernah meminta alamat email, nomor telepon WhatsApp, nomor induk kependudukan (NIK), atau nomor induk siswa nasional (NISN).
2. **Nama Tampilan Pseudonim**: Murid dianjurkan menggunakan nama panggilan imajinatif atau nama depan pendek saja (maks 32 karakter).
3. **Pemberitahuan Guru & Wali**: Guru mengelola kode kelas (*cohort code*) dan dapat membimbing murid mereset passphrase melalui audit log sekolah tanpa memerlukan akses email eksternal.

---

## 3. Redaksi Log & Sanitasi Data Sensitif

Semua logger aplikasi (Next.js server console dan Nginx access logs) menerapkan aturan filter redaksi ketat:

```typescript
// Konfigurasi Sanitasi Logger (Spesifikasi Arsitektur)
const REDACTED_FIELDS = [
  'passphrase',
  'password',
  'token',
  'sessionToken',
  'authorization',
  'cookie',
  'auth_token',
  'secret'
];

function sanitizeLogPayload(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (REDACTED_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogPayload(sanitized[key] as Record<string, unknown>);
    }
  }
  return sanitized;
}
```

---

## 4. Siklus Hidup Penghapusan & Anonimisasi Data

Saat pengguna (atau wali/guru) mengajukan penghapusan akun melalui `/api/v1/consent/account`:

1. **Fase 1: Soft-Delete & Karantina (Hari 0 - 7)**:
   - Kolom `users.deleted_at` diisi dengan stempel waktu sekarang.
   - Seluruh sesi aktif di tabel `sessions` segera dimusnahkan (`REVOKED`).
   - Kredensial tidak dapat digunakan untuk login kembali, kecuali pengguna membatalkan penghapusan dalam batas waktu 7 hari.
2. **Fase 2: Purge Fisik / Anonimisasi Agregat (Hari ke-8)**:
   - Data kredensial (`accounts`), sesi (`sessions`), dan instalasi (`client_installations`) **DIHAPUS SECARA FISIK (HARD DELETE)** dari database.
   - Record transaksi bermain di `playthrough_attempts` dan `gameplay_actions` diputus referensinya dari akun (`user_id = NULL`) sehingga menjadi data telemetri anonim murni untuk kepentingan riset kurikulum nasional tanpa melanggar privasi individu.

---

## 5. Batas Persetujuan (*Consent Boundaries*) & Legal Disclaimer

> [!WARNING]
> **Catatan Kepatuhan Regulasi & Tinjauan Operasional Legal**:
> 1. Dokumen ini merefleksikan kontrol teknis arsitektural (*technical privacy safeguards*), dan **bukan merupakan opini hukum formal** atau jaminan pemenuhan mutlak Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022).
> 2. Sebelum implementasi skala penuh ke sekolah negeri/swasta, institusi penyelenggara wajib melakukan peninjauan operasional legal independen, termasuk pembuatan Dokumen Perjanjian Pemrosesan Data Siswa (*Data Processing Agreement*) antara pihak sekolah dan penyedia server.
> 3. Setiap sekolah berhak menetapkan formulir persetujuan tertulis dari orang tua/wali murid sebelum kegiatan belajar berbasis aplikasi digital diselenggarakan di laboratorium komputer sekolah.
