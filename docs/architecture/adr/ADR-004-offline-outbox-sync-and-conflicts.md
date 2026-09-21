# ADR-004: Pola Outbox Offline & Resolusi Konflik Sinkronisasi (Offline Outbox & Conflict Resolution)

- **Status**: PROPOSED
- **Tanggal**: 2026-09-21
- **Pengambil Keputusan**: Tim Arsitektur Finspire

---

## 1. Konteks (Context)

Koneksi internet di sekolah-sekolah Indonesia seringkali tidak stabil, mengalami lonjakan latensi tinggi, atau terputus sama sekali selama jam pelajaran. Murid harus dapat memainkan novel visual edukatif secara penuh tanpa koneksi internet aktif.

Ketika perangkat kembali terhubung ke jaringan internet (misalnya saat murid pulang ke rumah atau saat Wi-Fi sekolah pulih), seluruh aksi gameplay yang terjadi selama periode offline harus disinkronkan ke server secara andal. Tantangan teknis yang muncul:
1. Menghindari hilangnya data aksi akibat crash browser atau pemadaman listrik mendadak di lab sekolah.
2. Menghindari pemalsuan waktu bermain (*time-travel / clock skew attack*) dari jam lokal perangkat klien untuk mendapatkan streak harian.
3. Menyelesaikan konflik ketika terjadi pengiriman aksi bercabang yang berbeda dari dua jendela/tab browser atau dua gawai berbeda (*forked gameplay decisions*).

---

## 2. Keputusan (Decision)

Kami mengadopsi pola **Client Outbox Berbasis IndexedDB dengan Resolusi Konflik First-Accepted Decision Wins**:

### 2.1 Mekanisme Outbox Klien
- Setiap keputusan gameplay disimpan terlebih dahulu secara persisten ke tabel IndexedDB `sync_outbox` sebelum efek visual ditampilkan di layar.
- Setiap aksi membawa metadata: `actionId` (UUID v4 unik), `clientSequence` (nomor urut monotonik per instalasi), `attemptId`, `sceneNodeId`, `choiceId`, `contentReleaseId`, dan `occurredAt`.
- Klien **hanya menghapus record outbox** jika dan hanya jika server mengembalikan respon HTTP 200 yang memuat hasil pemrosesan eksplisit (`accepted`, `duplicate`, atau `conflict`) untuk `actionId` terkait.

### 2.2 Strategi Resolusi Konflik: First-Accepted Decision Wins
- Dalam satu sesi percobaan bab (`attempt_id`), pohon cerita bersifat deterministik.
- Database server menegakkan aturan unik:
  ```sql
  CONSTRAINT uq_gameplay_attempt_node UNIQUE (attempt_id, scene_node_id)
  ```
- **Aturan Eksekusi**:
  1. Aksi pertama yang diterima dan divalidasi oleh server untuk `scene_node_id` tertentu dinyatakan sebagai keputusan kanonikal (`status: "accepted"`).
  2. Aksi berikutnya yang mengirimkan pilihan identik untuk node yang sama diperlakukan sebagai duplikat jaringan yang aman (`status: "duplicate"`).
  3. Aksi berikutnya yang mengirimkan pilihan BERBEDA untuk node yang sama di dalam percobaan yang sama dinyatakan sebagai anomali cabang (*forked timeline*) dan **DITOLAK** (`status: "conflict"`). Klien menerima instruksi untuk menyelaraskan status lokal dengan state kanonikal server.

### 2.3 Independensi Jam Klien (Clock Independence)
- Stempel waktu klien (`occurredAt`) hanya diperlakukan sebagai metadata diagnostik urutan lokal.
- **Kalkulasi streak harian dan pemberian hak reward 100% menggunakan stempel waktu server** yang dinormalisasi ke zona waktu Indonesia Barat (`Asia/Jakarta`, WIB). Perubahan jam lokal di laptop/HP murid tidak memiliki dampak terhadap status streak.

---

## 3. Alternatif yang Dipertimbangkan (Alternatives Considered)

- **Alternatif A: Last Write Wins (LWW)**:
  - *Alasan Ditolak*: Sangat berbahaya dalam game edukatif; memungkinkan murid memilih jawaban salah secara offline, lalu mengubahnya menjadi jawaban benar saat online dengan menimpa data historis, merusak validitas rubrik penilaian.
- **Alternatif B: Conflict-free Replicated Data Types (CRDT)**:
  - *Alasan Ditolak*: Kompleksitas matematis yang tidak perlu untuk struktur pohon keputusan naratif yang hierarkis dan deterministik.
- **Alternatif C: Sinkronisasi Real-Time WebSocket Saja**:
  - *Alasan Ditolak*: Gagal total saat offline; menghabiskan alokasi thread koneksi pada Single-VPS saat puluhan murid online bersamaan.

---

## 4. Konsekuensi (Consequences)

- **Positif**:
  - Pengalaman bermain offline sangat mulus (*zero latency local feedback*).
  - Data aksi aman dari kehilangan data lokal berkat persistensi IndexedDB ACID.
  - Integritas pohon cerita dan penilaian guru terlindungi dari manipulasi cabang ganda.
- **Negatif**:
  - Jika murid sengaja membuka dua tab dan membuat pilihan bertentangan, tab kedua akan menerima notifikasi konflik dan harus memuat ulang state server.
- **Netral**:
  - Membutuhkan logika manajemen outbox terstruktur di klien (Zustand + IndexedDB sync worker).

---

## 5. Dampak Keamanan & Privasi (Security & Privacy Impact)

- Mencegah *replay attack* dan manipulasi jam kalender (*streak farming*).
- Menjamin data outbox diisolasi per ID pengguna pada perangkat laboratorium bersama.

---

## 6. Migrasi & Rollback (Migration & Rollback Strategy)

- Protokol ini didefinisikan secara formal dalam [`docs/architecture/OFFLINE_SYNC_PROTOCOL.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/architecture/OFFLINE_SYNC_PROTOCOL.md) dan diimplementasikan pada Fase 05.
- Versi protokol (`protocolVersion: 1`) disematkan pada setiap request sync; jika terjadi perubahan format di masa depan, server dapat menangani migrasi versi secara transparan (*backward compatibility*).

---

## 7. Bukti & Referensi (Evidence & References)

- Martin Fowler: *Outbox Pattern for Reliable Distributed Messaging*.
- Protokol Sinkronisasi Finspire: [`docs/architecture/OFFLINE_SYNC_PROTOCOL.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/architecture/OFFLINE_SYNC_PROTOCOL.md).
