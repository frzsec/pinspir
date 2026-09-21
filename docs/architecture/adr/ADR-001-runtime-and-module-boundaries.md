# ADR-001: Batasan Modul & Runtime Aplikasi (Runtime & Module Boundaries)

- **Status**: PROPOSED
- **Tanggal**: 2026-09-21
- **Pengambil Keputusan**: Tim Arsitektur Finspire

---

## 1. Konteks (Context)

Finspire dibangun di atas Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, Zustand v5, dan Motion. Sistem ini harus mendukung dua skenario operasi yang kontradiktif:
1. Menjalankan PWA interaktif secara offline di lingkungan sekolah dengan sumber daya perangkat rendah.
2. Menyajikan API otentikasi, sinkronisasi batch, dan analitik agregat guru di server VPS mandiri (Ubuntu, Single-VPS, PostgreSQL 16).

Dibutuhkan batasan modul yang sangat tegas (*strict boundaries*) agar kode sisi server (seperti Drizzle ORM, koneksi database pool, modul kriptografi Argon2) tidak pernah bocor atau dibundel ke bundle JavaScript sisi klien, dan sebaliknya, API browser (seperti IndexedDB, Service Worker, Window/Document) tidak pernah dieksekusi di lingkungan Node.js server.

---

## 2. Keputusan (Decision)

Kami menetapkan arsitektur pembagian modul 4-layer (*layered modular architecture*) dengan pemisahan runtime ketat:

```
[Layer Klien: PWA UI & Offline Store]
   │ (src/components/*, src/stores/*, src/lib/offline/idb-*) -> 'use client'
   ▼
[Layer Kontrak Bersama: Shared Schemas & Types]
   │ (src/types/*, src/contracts/*, content/schema/*) -> Isomorphic TypeScript
   ▲
[Layer Aplikasi Server: Route Handlers & Controllers]
   │ (src/app/api/*, src/services/*) -> Node.js Runtime (Server Only)
   ▼
[Layer Akses Data: Drizzle ORM & Database Driver]
   │ (src/db/*) -> Node.js Runtime (Import guarded with 'server-only')
```

### Aturan Batasan Modul:
1. **Guard `server-only`**: Seluruh modul dalam `src/db/` dan `src/services/` wajib mengimpor paket `server-only`. Upaya mengimpor file ini dari komponen klien akan memicu kompilasi gagal (*build error*).
2. **Isolasi IndexedDB Klien**: Seluruh interaksi dengan IndexedDB dan Service Worker ditempatkan di bawah `src/lib/offline/` dan hanya dipanggil dalam siklus hidup komponen klien (`useEffect` atau event handler).
3. **Penyatuan Skema Validasi**: Validasi input API dan struktur data outbox menggunakan skema JSON TypeScript murni yang dibagikan (*shared*), memastikan kontrak antara klien dan server selalu sejalan.

---

## 3. Alternatif yang Dipertimbangkan (Alternatives Considered)

- **Alternatif A: Single Monolith Tanpa Pemisahan Direktori**: Menggabungkan logika database langsung di dalam server actions di samping komponen UI.
  - *Alasan Ditolak*: Rawan kebocoran dependensi server ke klien, menyulitkan pengetesan unit logika offline, dan memperbesar ukuran bundel PWA.
- **Alternatif B: Pemisahan Repo Terpisah (Monorepo Klien & Server)**: Membangun backend Fastify/Express terpisah dari frontend Next.js.
  - *Alasan Ditolak*: Menambah kompleksitas operasional deployment pada Single-VPS mandiri, menggandakan overhead memori RAM, dan menyulitkan tim pengembang kecil.

---

## 4. Konsekuensi (Consequences)

- **Positif**:
  - Ukuran bundel JavaScript klien tetap minimal (< 250 KB gzip untuk shell awal), mempercepat waktu muat pada PC lab sekolah berspesifikasi rendah.
  - Kerapian arsitektur menjamin kemudahan audit keamanan dan isolasi pengujian integrasi database.
- **Negatif**:
  - Pengembang harus disiplin mendeklarasikan tipe data bersama di direktori khusus dan tidak boleh melakukan impor pintas (*shortcut imports*).
- **Netral**:
  - Membutuhkan penyiapan linting ESLint dengan aturan `import/no-restricted-paths`.

---

## 5. Dampak Keamanan & Privasi (Security & Privacy Impact)

- Mencegah secara mutlak kebocoran kredensial database (`DATABASE_URL`), secret key otentikasi, dan logika hash passphrase ke browser klien.
- Menjamin sanitasi log hanya terjadi di sisi server sebelum data disimpan ke disk.

---

## 6. Migrasi & Rollback (Migration & Rollback Strategy)

- Batasan ini ditegakkan sejak awal Fase 03; tidak memerlukan migrasi kode warisan.
- Rollback: Jika terjadi masalah kompatibilitas bundling Next.js, aturan impor dapat dilonggarkan sementara di tingkat `tsconfig.json` paths tanpa merusak struktur folder.

---

## 7. Bukti & Referensi (Evidence & References)

- Dokumentasi Resmi Next.js App Router: *Package `server-only` and Server Component Boundaries*.
- Kontrak Bersama Proyek: [`docs/antigravity/00-shared-contract.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/antigravity/00-shared-contract.md).
