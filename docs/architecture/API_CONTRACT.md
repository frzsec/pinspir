# Finspire REST API Contract & Route Handler Specifications

Dokumen ini mendefinisikan standar teknis, envelope error, batas laju (*rate limiting*), batas ukuran payload, serta matriks ketersediaan online/offline untuk Route Handlers `/api/v1`. Definisi formal mesin tersedia dalam berkas pendamping [`openapi.v1.json`](./openapi.v1.json).

---

## 1. Standar Format Permintaan & Respons

### 1.1 Header Wajib
- `Content-Type`: `application/json; charset=utf-8`
- `Accept`: `application/json`
- `x-request-id`: UUID v4 yang dibangkitkan klien atau reverse proxy Nginx untuk penelusuran log lintas-sistem (*correlation ID*). Seluruh respons server menyertakan header ini.
- `x-client-version`: Versi aplikasi PWA klien (misal: `1.0.0`).
- `x-installation-id`: UUID v4 instalasi unik klien pada peramban.

### 1.2 Format Sukses & Paginasi
Respons data tunggal dikembalikan langsung atau di dalam objek payload:
```json
{
  "data": { ... },
  "serverTime": "2026-09-21T02:30:00.000Z"
}
```

Respons daftar koleksi (*paginated list*) menggunakan cursor pagination berbasis ID/timestamp:
```json
{
  "items": [ ... ],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJpZCI6IjEyMyIsInNlcSI6NDV9",
    "hasMore": false
  },
  "serverTime": "2026-09-21T02:30:00.000Z"
}
```

### 1.3 Envelope Kesalahan Terstandarisasi (*Standard Error Envelope*)
Seluruh respons kesalahan (status HTTP $\ge 400$) **WAJIB** menggunakan format seragam berikut:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload tindakan tidak memenuhi skema konten aktif.",
    "details": {
      "field": "payload.choiceId",
      "expected": "string"
    }
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "serverTime": "2026-09-21T02:30:00.000Z"
}
```

#### Tabel Kode Kesalahan Stabil (*Stable Error Codes*):
| Kode Kesalahan | HTTP Status | Keterangan & Tindakan Klien |
|---|---|---|
| `UNAUTHORIZED` | 401 | Sesi kedaluwarsa atau belum login. Klien menahan outbox dan meminta login ulang akun yang sama. |
| `FORBIDDEN` | 403 | Kredensial valid tetapi tidak berhak mengakses resource (misal: guru mengakses cohort lain). |
| `NOT_FOUND` | 404 | Resource tidak ditemukan (misal: releaseId atau attemptId salah). |
| `VALIDATION_ERROR` | 400 / 422 | Format JSON salah atau tipe data tidak memenuhi schema. Tindakan ditolak permanen (`non-retryable`). |
| `IDEMPOTENT_DUPLICATE`| 200 / 409 | Aksi dengan `actionId` yang sama persis telah diproses sebelumnya. Mengembalikan hasil canonical terdahulu. |
| `CONFLICT_SLOT_OCCUPIED`| 409 | Pilihan berbeda diajukan untuk scene yang sudah diselesaikan pada attempt yang sama. Client mengadopsi canonical server. |
| `STALE_CONTENT_VERSION`| 409 | Aksi dimainkan pada versi rilis lama yang sudah berstatus `retired`. Klien harus mengunduh rilis baru. |
| `RATE_LIMITED` | 429 | Ambang batas frekuensi permintaan terlampaui. Klien melakukan backoff sesuai header `Retry-After`. |
| `SERVER_ERROR` | 500 | Gangguan tak terduga pada server. Klien mempertahankan antrean outbox dan mengulang nanti (*retryable*). |
| `SERVICE_UNAVAILABLE`| 503 | Database PostgreSQL atau proses internal sedang maintenance/restart. |

---

## 2. Batas Ukuran & Batas Laju Permintaan (*Size & Rate Limits*)

Untuk melindungi ketersediaan single-VPS pilot dari kelebihan beban dan serangan DoS:

| Endpoint Group | Batas Ukuran Payload | Batas Laju (*Rate Limit*) | Kebijakan Penegakan |
|---|---|---|---|
| `/api/v1/auth/*` | Maks 10 KB | 5 req / menit per IP | Mencegah brute-force player code / access code. Menggunakan in-memory leaky bucket. |
| `/api/v1/sync/batch` | Maks 100 KB (Maks 50 aksi) | 30 req / menit per user | Jalur utama sinkronisasi offline. Batch > 50 aksi ditolak dengan `BATCH_TOO_LARGE`. |
| `/api/v1/content/*` | N/A (GET) | 60 req / menit per IP | Respons rilis dilengkapi header HTTP ETag dan cache Nginx 1 jam. |
| `/api/v1/analytics/events`| Maks 20 KB (Maks 20 event) | 20 req / menit per user | Telemetri first-party allowlisted. |
| Endpoint Lainnya | Maks 20 KB | 60 req / menit per user | Standar REST call. |

---

## 3. Matriks Ketersediaan Online / Offline & Strategi Caching

| Endpoint | Metode | Dukungan Offline | Perilaku Klien Saat Offline | Strategi Cache Service Worker |
|---|---|---|---|---|
| `/health/*` | `GET` | Tidak | Mengembalikan status koneksi `navigator.onLine = false` | **Network-Only** (Dilarang Cache) |
| `/bootstrap` | `GET` | Ya (Fallback) | Menggunakan profil dan active release snapshot terakhir dari IndexedDB | **Network-First** dengan Fallback IndexedDB |
| `/auth/*` | `POST` | Tidak | Menampilkan notifikasi: "Pendaftaran/Login membutuhkan koneksi internet." | **Network-Only** (Dilarang Keras Cache) |
| `/content/catalog` | `GET` | Ya | Menampilkan rilis yang telah tersimpan di IndexedDB | **Stale-While-Revalidate** |
| `/content/releases/*` | `GET` | Ya | Membaca berkas manifest dan chapter JSON dari IndexedDB `content_packs` | **Cache-First** (Immutable via Content Hash) |
| `/playthrough/attempts` | `POST` | Ya | Dibangkitkan lokal di IndexedDB; attempt dicatat ke server saat sync pertama | **Local-First Outbox** |
| `/sync/batch` | `POST` | Ya | Ditahan di antrean `outbox_actions` IndexedDB; di-flush otomatis saat koneksi pulih | **Network-Only** (Dilarang Keras Cache) |
| `/leaderboard/cohort` | `GET` | Tidak | Menampilkan cache leaderboard terakhir dengan badge "Data Terakhir Tersimpan" | **Network-First** |
| `/teacher/*` | `GET/POST`| Tidak | Khusus guru dengan akses internet aktif | **Network-Only** (Dilarang Cache) |
| `/privacy/*` | `GET/POST`| Tidak | Kebijakan kepatuhan data membutuhkan otorisasi server langsung | **Network-Only** (Dilarang Cache) |
| `/push/*` | `POST` | Tidak | Registrasi push service browser memerlukan koneksi langsung | **Network-Only** (Dilarang Cache) |
| `/analytics/events` | `POST` | Ya | Antrean telemetri lokal; dikirim bersamaan atau saat online | **Network-Only** |

> [!WARNING]
> **Larangan Wildcard Caching API**:
> Seluruh rute `/api/v1/*` berstatus **Network-Only** pada Service Worker secara default, kecuali berkas statis rilis konten immutable yang memiliki ETag/hash konten unik. Cookie autentikasi dan respons sinkronisasi dilarang disimpan ke Cache Storage API.
