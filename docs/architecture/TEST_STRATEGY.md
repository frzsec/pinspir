# Strategi Pengujian (Test Strategy)

Dokumen ini mendefinisikan piramida pengujian, arsitektur deterministik, matriks lingkungan sekolah, kebijakan database pengujian, dan protokol verifikasi kualitas menyeluruh untuk Finspire.

---

## 1. Piramida Pengujian (Testing Pyramid)

Piramida pengujian Finspire dirancang untuk memaksimalkan kecepatan umpan balik (*feedback loop*) dan menjamin ketahanan sistem saat dijalankan pada infrastruktur single-VPS mandiri dan kondisi jaringan sekolah yang fluktuatif:

```
                      / \
                     /   \
                    / E2E \           (5%)  Playwright: Alur Murid & Guru PWA Offline
                   /-------\
                  / Kontrak \         (10%) OpenAPI Spec & Schema Sync Ingestion
                 /-----------\
                /  Integrasi  \       (25%) Drizzle ORM + PostgreSQL Nyata (Docker)
               /---------------\
              /      Unit       \     (60%) Evaluator Rubrik, Sync FSM, Redaksi Log
             /-------------------\
```

### 1.1 Rincian Layer Pengujian

| Level Pengujian | Lingkup & Target | Alat / Runner | Kecepatan Eksekusi |
| :--- | :--- | :--- | :--- |
| **Unit Test** | Logika bisnis murni: Evaluasi rubrik pedagogis, state machine outbox klien, kalkulasi streak WIB, sanitasi log, hashing SHA-256. | Node Test Runner / Vitest | < 10 detik (Parallel) |
| **PostgreSQL Integration** | Operasi database nyata: Transaksi atomik, unique constraint ledger, row-level authorization, migrasi Drizzle. | Testcontainers / Postgres Local Test DB | < 45 detik |
| **API Contract Test** | Kepatuhan skema OpenAPI 3.1.0 (`openapi.v1.json`), validasi status kode HTTP, format amplop error seragam. | Supertest / Fetch Harness + Ajv | < 20 detik |
| **Browser E2E (Online & Offline)** | Alur bermain ujung-ke-ujung: Registrasi pseudonim, main Bab 1 offline, restart browser, reconnect sync, cek dashboard guru. | Playwright (Chrome, Mobile Chrome) | < 3 menit |
| **Security Negative Test** | Uji penetrasi otomatis: Brute-force rate limiting, eksploitasi BOLA, payload sync > 1MB, replay request kembar. | Scripted Attack Harness | < 30 detik |
| **Backup & Restore Test** | Pengujian integritas berkas dump PostgreSQL: Ekspor basis data, hapus database lokal, impor ulang, verifikasi checksum data. | Bash / PowerShell Script | < 1 menit |
| **Load Baseline Test** | Uji beban simulasi 1 kelas bermain serentak (40 murid melakukan sync bersamaan saat bel sekolah berbunyi). | k6 / autocannon | < 2 menit |

---

## 2. Injeksi Ketergantungan Deterministik (Deterministic Clocks & Generators)

Untuk memastikan seluruh pengujian menghasilkan output yang dapat diulang secara konsisten (*reproducible*) dan bebas dari efek samping (*flakiness*), sistem menyediakan abstraksi injeksi:

### 2.1 Provider Waktu Deterministik (`ClockProvider`)

Waktu server kanonikal terikat pada zona waktu Indonesia Barat (`Asia/Jakarta`, WIB). Dalam lingkungan uji, waktu diinjeksi secara eksplisit:

```typescript
export interface IClockProvider {
  now(): Date;
  nowIso(): string;
  todayWib(): string; // Format: YYYY-MM-DD
}

export class SystemClockProvider implements IClockProvider {
  now(): Date { return new Date(); }
  nowIso(): string { return this.now().toISOString(); }
  todayWib(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(this.now());
  }
}

export class MockClockProvider implements IClockProvider {
  private currentTime: Date;
  constructor(initialIsoString: string) {
    this.currentTime = new Date(initialIsoString);
  }
  advanceHours(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 3600 * 1000);
  }
  now(): Date { return this.currentTime; }
  nowIso(): string { return this.currentTime.toISOString(); }
  todayWib(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(this.currentTime);
  }
}
```

### 2.2 Generator ID & Entropi Terkendali (`UuidGenerator`)

Generator UUID v4 dapat diatur untuk menghasilkan deret ID deterministik selama pengetesan regresi integrasi:

```typescript
export interface IUuidGenerator {
  generate(): string;
}

export class DeterministicUuidGenerator implements IUuidGenerator {
  private counter = 0;
  constructor(private prefix = '00000000-0000-4000-8000') {}
  generate(): string {
    this.counter++;
    const suffix = this.counter.toString(16).padStart(12, '0');
    return `${this.prefix}-${suffix}`;
  }
}
```

---

## 3. Kebijakan Database Bersih (Fresh DB Policy)

1. **Isolasi Database Pengujian**: Seluruh tes integrasi dijalankan pada basis data terpisah (`finspire_test`), bukan basis data pengembangan lokal (`finspire_dev`).
2. **Setup Skema Sebelum Suite**: Setiap sesi pengujian mengeksekusi `drizzle-kit push` atau menjalankan migrasi terbaru ke database bersih.
3. **Pembersihan Antar Pengujian**:
   - Untuk tes unit yang memanfaatkan transaksi, gunakan pola `BEGIN ... ROLLBACK` per kasus uji.
   - Untuk tes batch multi-transaksi, jalankan pembersihan terarah (*truncation*) pada tabel relasional (`reward_ledger`, `gameplay_actions`, `playthrough_attempts`, `sessions`, `users`) dengan mengabaikan tabel referensi statis (`content_releases`, `schools`).

---

## 4. Matriks Perangkat Sekolah Realistis (Device Matrix)

Pengujian E2E dan performa visual wajib mensimulasikan karakteristik perangkat keras sekolah di Indonesia:

| Profil Perangkat | Spesifikasi Perangkat Keras | Lingkungan Jaringan | Browser Target |
| :--- | :--- | :--- | :--- |
| **PC Lab Sekolah (Low-End)** | Intel Celeron N4020 / Core i3 Gen 4, RAM 4GB, Layar 1366x768 (16:9). | Wi-Fi Sekolah Bersama (Latensi 150ms, Packet Loss 3%, Bandwidth 2 Mbps per PC). | Google Chrome Desktop (Versi LTS), Edge. |
| **Smartphone Murid (Entry-Level)** | Mediatek Helio G35 / Snapdragon 680, RAM 3GB-4GB, Layar 720p/1080p. | Seluler 4G Fluktuatif (Bisa terputus di dalam ruangan gedung beton). | Chrome Mobile, Samsung Internet. |
| **Laptop Guru (Mid-Range)** | Core i5 / Ryzen 5, RAM 8GB-16GB, Full HD 1080p. | Tethering 4G / Wi-Fi Kantor Guru. | Google Chrome, Firefox. |

### 4.1 Parameter Simulasi Jaringan Playwright

```typescript
export const NetworkProfiles = {
  SchoolWifiCongested: {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (512 * 1024) / 8,          // 512 Kbps
    latency: 180,                                 // 180 ms RTT
  },
  TotalOffline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  }
};
```

---

## 5. Matriks Ketertelusuran Pengujian (Requirement-to-Test Mapping)

| Kode Kebutuhan | Deskripsi Kebutuhan | Tipe Pengujian | ID Kasus Uji | Kriteria Lolos (Pass Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| `CNT-VAL-01` | Validasi JSON Schema 2020-12 & Rubrik Konten | Unit / CI | `TC-CNT-001` | Lolos skema Draft 2020-12 tanpa warning; skor bobot total = 100 per mastery check. |
| `AUTH-PSEUDO-01` | Registrasi & Login Pseudonim Tanpa PII | Integrasi DB | `TC-AUTH-001` | Pengguna dapat membuat akun dengan Player Code & Passphrase; tidak ada kolom email/telepon wajib. |
| `AUTH-RATE-02` | Proteksi Brute-force Login Kredensial | Keamanan | `TC-AUTH-002` | Request ke-6 dari IP yang sama dalam jendela 10 menit menghasilkan HTTP 429 Too Many Requests. |
| `OFF-OUTBOX-01` | Penyimpanan Aksi Lokal di IndexedDB | E2E Browser | `TC-OFF-001` | Pemain memilih cabang cerita saat offline; aksi tercatat di tabel IndexedDB `sync_outbox`. |
| `OFF-SYNC-02` | Idempotensi Batch Sync & Anti-Farming | Integrasi DB | `TC-OFF-002` | Pengiriman ulang batch yang sama menghasilkan `status: duplicate`; saldo reward bertambah tepat 1 kali. |
| `OFF-FIRST-WIN` | Keputusan Pertama Menang (*First-Accepted Wins*) | Integrasi DB | `TC-OFF-003` | Percobaan mengirim keputusan berbeda untuk node yang sama menghasilkan `status: conflict`. |
| `SCH-BOLA-01` | Otorisasi Akses Kelas Guru (Anti-IDOR) | Integrasi API | `TC-SCH-001` | Guru A mengakses `/api/v1/schools/cohorts/:id/summary` milik Guru B menerima status HTTP 403 Forbidden. |
| `PRIV-CLEAN-01` | Clean Sign Out pada Perangkat Bersama | E2E Browser | `TC-PRIV-001` | Klik tombol "Keluar Bersih" menghapus session cookie, membersihkan outbox lokal, dan mengunci layar login. |
| `OPS-BACKUP-01` | Prosedur Pemulihan Basis Data (Restore Verification) | Operasional | `TC-OPS-001` | Script restore backup PostgreSQL menghasilkan tabel dengan checksum data 100% identik dengan sumber. |
