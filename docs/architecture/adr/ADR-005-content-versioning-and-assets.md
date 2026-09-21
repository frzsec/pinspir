# ADR-005: Versioning Rilis Konten & Manajemen Aset Multimedia (Content Versioning & Assets)

- **Status**: PROPOSED
- **Tanggal**: 2026-09-21
- **Pengambil Keputusan**: Tim Arsitektur Finspire

---

## 1. Konteks (Context)

Konten edukasi finansial Finspire (skenario pinjol, arisan, anggaran) ditulis oleh tim kurikulum/pedagogis dan harus dapat diperbarui, ditambah, atau diperbaiki tanpa memerlukan proses kompilasi ulang (*rebuild*) atau *re-deployment* seluruh aplikasi Next.js.

Selain itu, media visual seperti animasi karakter dengan transparansi (WebM alpha) harus dapat dijalankan dengan lancar pada laptop sekolah berspesifikasi rendah (RAM 4GB, prosesor hemat daya) dan gawai seluler dengan koneksi hemat data, serta mematuhi aturan aksesibilitas sensitivitas gerakan (*reduced motion*).

---

## 2. Keputusan (Decision)

Kami mengadopsi pola **Paket Rilis Konten Imutabel Deklaratif dengan Kamus Kunci Logis (Immutable Content Packs with Logical Asset Dictionary)**:

```
[Direktori Rilis: content/releases/pilot-v1-draft/]
   ├── manifest.json            <- Metadata rilis, SHA-256 digests, & assetDictionary
   ├── chapter-01.json          <- Pohon narasi Bab 1 & rubrik evaluasi
   └── chapter-02.json          <- Pohon narasi Bab 2 & rubrik evaluasi
```

### Prinsip Keputusan Utama:
1. **Immutability Rilis Pasca Validasi**:
   - Setelah rilis divalidasi oleh skrip skema JSON Draft 2020-12 dan digest SHA-256 dicatat di tabel `content_releases`, rilis tersebut **TIDAK BOLEH DIUBAH LAGI SECARA IN-PLACE**.
   - Setiap revisi materi cerita wajib menghasilkan rilis baru dengan `release_id` berbeda (misalnya: `2026.03-v2`).
2. **Pemisahan Kunci Logis vs URL Aset**:
   - Skrip narasi JSON tidak pernah memuat URL path fisik file media secara langsung. Skrip hanya mereferensikan kunci logis (e.g., `visual: { characterKey: "char_ari_neutral" }`).
   - Resolusi ke URL file dilakukan melalui `manifest.json` pada objek `assetDictionary`. Hal ini memungkinkan penggantian resolusi atau kompresi gambar tanpa menyentuh file cerita.
3. **Standar WebM Transparan & Fallback Wajib**:
   - Setiap entri animasi video transparan dalam `assetDictionary` wajib menyertakan `posterPath` berupa gambar WebP statis.
   - Jika browser tidak mendukung pemutaran video alpha berakselerasi perangkat keras atau pengguna mengaktifkan preferensi `prefers-reduced-motion`, sistem otomatis menampilkan gambar poster statis tanpa memblokir alur cerita.
4. **Rollback Non-Destruktif**:
   - Jika rilis bermasalah, server mengaktifkan kembali rilis stabil sebelumnya melalui transaksi atomik database.
   - Seluruh catatan bermain historis yang pernah merujuk ke rilis bermasalah tetap dipertahankan (*append-only history preserved*), memastikan audit kelulusan murid tidak rusak.

---

## 3. Alternatif yang Dipertimbangkan (Alternatives Considered)

- **Alternatif A: Menulis Cerita Langsung sebagai Komponen React / TypeScript**:
  - *Alasan Ditolak*: Setiap koreksi saltik (typo) atau penyesuaian bobot rubrik mengharuskan rebuild dan deployment ulang Next.js; menyulitkan kolaborasi dengan penyusun kurikulum non-programmer.
- **Alternatif B: Menggunakan Headless CMS Eksternal (Strapi / Sanity / Contentful)**:
  - *Alasan Ditolak*: Melanggar batasan arsitektur (zero paid SaaS, single-VPS mandiri), menambah beban dependensi jaringan, dan mempersulit pengunduhan bundel offline lengkap dalam format PWA.

---

## 4. Konsekuensi (Consequences)

- **Positif**:
  - Penulis kurikulum dapat menguji dan memvalidasi konten secara independen menggunakan `npm run content:validate`.
  - PWA dapat mengunduh dan menyimpan bundel konten secara atomik ke IndexedDB untuk dimainkan 100% offline.
  - Performa visual terjamin ramah pada gawai berspesifikasi rendah di laboratorium sekolah.
- **Negatif**:
  - Mengharuskan proses build aset dan hashing SHA-256 yang disiplin pada setiap rilis materi baru.
- **Netral**:
  - Konten pilot awal (`pilot-v1-draft`) telah distandardisasi dan lolos uji regresi Fase 01R.

---

## 5. Dampak Keamanan & Privasi (Security & Privacy Impact)

- Verifikasi digest SHA-256 melindungi klien dari serangan manipulasi berkas cerita (*tamper-proofing*).
- File konten tidak memuat informasi rahasia atau data pribadi guru/murid.

---

## 6. Migrasi & Rollback (Migration & Rollback Strategy)

- Spesifikasi detail tercantum pada [`docs/architecture/CONTENT_RELEASE_PROTOCOL.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/architecture/CONTENT_RELEASE_PROTOCOL.md).
- Rollback cukup dilakukan via query SQL `UPDATE content_releases SET status = 'active' WHERE release_id = :previousId` di dalam transaksi tertutup.

---

## 7. Bukti & Referensi (Evidence & References)

- JSON Schema Draft 2020-12 Specification.
- Protokol Rilis Konten Finspire: [`docs/architecture/CONTENT_RELEASE_PROTOCOL.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/architecture/CONTENT_RELEASE_PROTOCOL.md).
- Status Rilis Konten Pilot: [`docs/content/STATUS.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/content/STATUS.md).
