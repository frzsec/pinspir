# ADR-003: Ledger Hadiah Append-Only & Proyeksi Pemain (Event Ledger & Projections)

- **Status**: PROPOSED
- **Tanggal**: 2026-09-21
- **Pengambil Keputusan**: Tim Arsitektur Finspire

---

## 1. Konteks (Context)

Dalam game visual novel edukatif berbasis offline, terdapat godaan dan celah besar terjadinya manipulasi nilai:
1. Pemain dapat memodifikasi memori/penyimpanan lokal untuk mengirimkan nilai XP atau bintang palsu (*client-side tampering*).
2. Terjadinya pengiriman ulang request sinkronisasi (*network replay / duplicate requests*) yang dapat melipatgandakan reward berkali-kali.
3. Inkonsistensi data saat proses sinkronisasi paralel terjadi dari dua tab browser berbeda atau saat reconnect internet.

Jika saldo XP dan bintang hanya disimpan sebagai angka mutabel (*mutable column*, e.g., `users.total_xp`), sistem tidak memiliki riwayat audit (*audit trail*) dan sangat rentan terhadap *race condition* serta eksploitasi ganda (*double rewarding*).

---

## 2. Keputusan (Decision)

Kami memutuskan untuk mengadopsi pola **Append-Only Reward Ledger dengan Proyeksi Terhitung (Rebuildable Projections)**:

```
[Klien Mengirim Keputusan Narasi]
   │ (nodeId: "ch1_decision_pinjol", choiceId: "tolak_tawaran")
   ▼
[Server Mengevaluasi Konten Kanonikal]
   │ Memeriksa apakah pilihan memenuhi rubrik reward
   ▼
[Penyisipan ke Tabel 'reward_ledger' (Append-Only)]
   │ UNIQUE(user_id, release_id, source_node_id, reward_type)
   │ ON CONFLICT DO NOTHING / RETURN DUPLICATE
   ▼
[Pembaruan Tabel 'player_projections']
   │ total_xp = SUM(reward_ledger.amount WHERE reward_type = 'xp')
   │ total_stars = SUM(reward_ledger.amount WHERE reward_type = 'star')
```

### Aturan Invarian:
1. **Server-Evaluated Rewards**: Klien HANYA mengirimkan keputusan narasi (`sceneNodeId`, `choiceId`), BUKAN jumlah bintang atau poin XP. Perhitungan hadiah sepenuhnya dieksekusi oleh mesin aturan server (*server rules engine*).
2. **Kekebalan Duplikasi Kriptografis**: Tabel `reward_ledger` memiliki batasan unik ketat:
   ```sql
   CONSTRAINT uq_reward_ledger_source UNIQUE (user_id, release_id, source_node_id, reward_type)
   ```
   Setiap node cerita dalam rilis konten tertentu hanya dapat memberikan hadiah satu kali seumur hidup per murid, terlepas dari berapa kali bab tersebut diulang.
3. **Proyeksi yang Dapat Dibangun Ulang (Rebuildable)**: Tabel `player_projections` hanyalah cache pembacaan cepat (*read-optimized materialized projection*). Jika terjadi anomali nilai, seluruh statistik pemain dapat dihitung ulang secara deterministik dari `reward_ledger` dan `playthrough_attempts`.

---

## 3. Alternatif yang Dipertimbangkan (Alternatives Considered)

- **Alternatif A: Kolom Mutabel Langsung (`UPDATE users SET xp = xp + :delta`)**:
  - *Alasan Ditolak*: Tidak ada riwayat asal-usul hadiah, mustahil mendeteksi double-rewarding dari replay sync, dan rawan deadlock pada pembaruan konkuren.
- **Alternatif B: Full Event Sourcing (Event Store Terpisah)**:
  - *Alasan Ditolak*: Terlalu berlebihan (*over-engineering*) untuk skala Single-VPS 2GB RAM; membutuhkan snapshotting yang rumit dan menambah beban I/O disk.
- **Alternatif C: Percaya Nilai dari Klien (*Client-Reported Score*)**:
  - *Alasan Ditolak*: Melanggar kontrak keamanan dasar; memungkinkan murid lab sekolah meretas skor XP dengan skrip konsol browser sederhana.

---

## 4. Konsekuensi (Consequences)

- **Positif**:
  - Nol kemungkinan double rewarding; sistem kebal terhadap replay sync network.
  - Auditabilitas penuh: Guru dan admin dapat melihat secara pasti dari node mana seorang murid memperoleh bintang atau XP tertentu.
  - Integritas papan peringkat (*leaderboard*) sekolah terjamin 100%.
- **Negatif**:
  - Pertumbuhan baris tabel `reward_ledger` sebanding dengan jumlah aksi murid (perlu indeks efisien).
- **Netral**:
  - Pembaruan saldo proyeksi dilakukan dalam transaksi yang sama saat penyisipan baris ledger.

---

## 5. Dampak Keamanan & Privasi (Security & Privacy Impact)

- Menghilangkan celah kecurangan ekonomi game (*anti-tampering & anti-farming*).
- Menjamin kepatuhan integritas data akademik sekolah.

---

## 6. Migrasi & Rollback (Migration & Rollback Strategy)

- Skema diinisialisasi pada Fase 03.
- Skrip rekonsiliasi: Disediakan fungsi `rebuildPlayerProjection(userId)` untuk memulihkan cache proyeksi kapan saja jika dibutuhkan.

---

## 7. Bukti & Referensi (Evidence & References)

- Martin Fowler: *Event Sourcing and Accounting Ledger Patterns*.
- Kontrak Bersama Proyek: [`docs/antigravity/00-shared-contract.md`](file:///c:/Users/FAIRUZ/Documents/jhic/finspire/docs/antigravity/00-shared-contract.md).
