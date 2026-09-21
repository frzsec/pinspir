# ADR-006: Pola Operasional Single-VPS & Zero Paid SaaS (Single-VPS Operations)

- **Status**: PROPOSED
- **Tanggal**: 2026-09-21
- **Pengambil Keputusan**: Tim Arsitektur Finspire

---

## 1. Konteks (Context)

Finspire didesain agar dapat dioperasikan secara mandiri oleh institusi pendidikan, yayasan sosial, atau sekolah dengan anggaran infrastruktur teknologi yang sangat terbatas. Ketergantungan pada layanan cloud berbayar berbasis pemakaian (*usage-based SaaS* seperti Supabase, Firebase, Vercel Pro, AWS RDS, Cloudflare Enterprise) menciptakan risiko biaya tak terduga (*runaway bills*) dan potensi vendor lock-in yang membebani keberlanjutan proyek.

Oleh karena itu, ditetapkan batasan tegas: **Zero Paid SaaS** dan arsitektur operasional yang dapat berjalan stabil pada **1 unit Virtual Private Server (VPS) Ubuntu mandiri** dengan spesifikasi minimal (2 vCPU, RAM 2GB–4GB, 40GB SSD).

---

## 2. Keputusan (Decision)

Kami mengadopsi pola **Topologi Kontainer Tunggal Mandiri (Self-Contained Single-VPS Stack) dengan Nginx Reverse Proxy**:

```
[Klien Web PWA & Gawai Sekolah]
   │ HTTPS (Port 443) / WSS
   ▼
[Nginx Reverse Proxy & SSL Certbot (Host / Docker)]
   ├── Terminasi TLS & Otomasi Let's Encrypt
   ├── Kompresi Brotli / Gzip & Header Keamanan (CSP, HSTS)
   ├── Rate Limiting Memori (IP Limiter Zone)
   └── Pembatasan Ukuran Body (client_max_body_size 1M)
   │
   ├── /_next/static/*  -> Sajikan langsung dari disk dengan cache 1 tahun
   ├── /assets/*        -> Sajikan aset publik dengan cache 1 tahun
   └── /                -> Proxy pass ke Next.js Standalone (Port 3000)
         │
         ▼
[Next.js 16 Standalone Node.js Runtime]
   │ Connection Pool (Max 20 koneksi, Timeout 5s)
   ▼
[PostgreSQL 16 Engine]
   └── Volume Persisten Host (/var/lib/postgresql/data)
         │
         ▼ (Cron Harian 02:00 WIB)
   [Skrip Pencadangan Terenkripsi Lokal: backup-db.sh]
```

### Rincian Konfigurasi Kritis:
1. **Tuning Memori untuk Menghindari OOM Killer**:
   - Pembuatan swap file Linux sebesar 4GB pada VPS.
   - Konfigurasi `max_connections = 50` dan `shared_buffers = 512MB` pada PostgreSQL untuk mengunci konsumsi RAM database di bawah 1GB.
   - Next.js dijalankan dalam mode `standalone` dengan flag Node.js `--max-old-space-size=1024` (1GB batas RAM).
2. **Reverse Proxy Nginx Terintegrasi**:
   - Nginx menangani seluruh traffic masuk, menerapkan rate limit 5 req/10m pada endpoint auth dan 30 req/m pada endpoint sync.
   - Menyajikan file statis secara langsung dari filesystem tanpa membebani thread Node.js.
3. **Pencadangan Otomatis Mandiri (*Zero-Cost Automated Backup*)**:
   - Cron job harian mengeksekusi `pg_dump` dengan kompresi gzip.
   - File dump dienkripsi secara lokal menggunakan kunci simetris `age` / `gpg`.
   - Retensi lokal 14 hari dengan pembersihan file lama otomatis via rotasi `find -mtime +14 -delete`.

---

## 3. Alternatif yang Dipertimbangkan (Alternatives Considered)

- **Alternatif A: Arsitektur Cloud Serverless (Vercel + Supabase + Neon)**:
  - *Alasan Ditolak*: Pelanggaran langsung terhadap batasan "Zero Paid SaaS"; memicu biaya tak terprediksi saat ada lonjakan ribuan murid sekolah mengakses sistem secara bersamaan di akhir semester.
- **Alternatif B: Klaster Kubernetes (K3s / MicroK8s)**:
  - *Alasan Ditolak*: Terlalu boros sumber daya (*resource-heavy*); overhead kontrol plane Kubernetes menghabiskan lebih dari 1.5GB RAM sendiri sebelum aplikasi berjalan.
- **Alternatif C: Database SQLite Tertanam (Embedded SQLite)**:
  - *Alasan Ditolak*: Kurang tangguh untuk penanganan transaksi konkuren multi-murid yang melakukan batch sync secara paralel saat jam pulang sekolah; PostgreSQL 16 jauh lebih unggul dalam integritas transaksi ACID dan kueri analitik kelas.

---

## 4. Konsekuensi (Consequences)

- **Positif**:
  - Biaya operasional server sangat terjangkau (cukup 1 VPS seharga ~$5–$10/bulan dari provider mana saja).
  - Kendali 100% atas data murid tanpa pihak ketiga komersial; kepatuhan privasi data lebih mudah diaudit.
  - Portabilitas penuh: Seluruh stack dapat dipindahkan ke VPS lain atau server lokal sekolah hanya dengan menyalin folder Docker dan me-restore dump database.
- **Negatif**:
  - Tanggung jawab pemeliharaan server (update OS Ubuntu, pembaruan sertifikat SSL, pemantauan disk) berada pada operator internal.
- **Netral**:
  - Memerlukan runbook operasional yang jelas bagi staf teknis sekolah/yayasan.

---

## 5. Dampak Keamanan & Privasi (Security & Privacy Impact)

- Basis data PostgreSQL tidak pernah diekspos ke port publik internet (hanya mendengarkan jaringan internal Docker / localhost).
- Firewall UFW diaktifkan di level OS, hanya membuka port 80 (HTTP redirect) dan port 443 (HTTPS).

---

## 6. Migrasi & Rollback (Migration & Rollback Strategy)

- Implementasi konfigurasi operasional dijadwalkan pada Fase 09.
- Prosedur pemulihan (*restore runbook*) diverifikasi menggunakan tes otomatis `TC-OPS-001` sebelum peluncuran resmi.

---

## 7. Bukti & Referensi (Evidence & References)

- PostgreSQL 16 Official Resource Tuning Guidelines.
- Dokumen Kontrak Bersama Proyek: [`docs/antigravity/00-shared-contract.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/antigravity/00-shared-contract.md).
