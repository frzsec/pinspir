# Sistem Ekonomi, Skor, dan Rekonsiliasi Saldo (Economy & Scoring)

Dokumen ini mendefinisikan formula matematis, aturan integritas data, anti-farming, dan rekonsiliasi saldo simulasi untuk **Finspire Production Pilot**.

---

## 1. Tiga Pilar Mata Uang & Poin

Finspire membedakan secara tegas tiga entitas nilai numerik untuk mencegah kerancuan antara simulasi dan gamifikasi:

| Entitas | Tipe Data | Cakupan | Sumber | Kegunaan | Aturan Integritas |
|---|---|---|---|---|---|
| **Simulated Money** | Integer Rupiah (`IDR`) | Di dalam cerita per Chapter | Saldo awal chapter & konsekuensi pilihan | Angka simulasi keputusan Foxy | Terisolasi per chapter/attempt; tidak dapat ditransfer ke akun nyata atau antar pemain. |
| **Virtual Coin (Koin Foxy)** | Integer | Global per Akun | Hadiah rilis scene, mini-game, & streak | Membuka kosmetik/outfit Foxy & dekorasi virtual | Divalidasi server; anti-farming 1x per node. |
| **XP (Experience Points)** | Integer | Global per Akun | Hadiah belajar, boss challenge, & streak | Level progress & evaluasi keaktifan | Nilai append-only; tidak pernah berkurang akibat kegagalan challenge. |

---

## 2. Aturan Perolehan XP & Koin

### 2.1 Matriks Perolehan Poin Standar
- **Selesai 1 Story Scene**: +10 XP, +5 Koin (hanya diberikan saat pertama kali menyelesaikan node tersebut).
- **Membaca 1 Modul Microlearning**: +5 XP (hanya 1x per modul).
- **Menyelesaikan Mini-Game**:
  - Percobaan pertama (Akurasi >= 80%): +25 XP, +10 Koin.
  - Percobaan ulang (*Replay* harian untuk latihan): +5 XP, +2 Koin (maksimal 2x replay berhadiah per hari kalender).
- **Menyelesaikan Boss Challenge**: +50 XP, +30 Koin, Unlock Badge Chapter (hanya 1x saat pertama kali lulus).
- **Milestone Streak 7 Hari**: +100 XP, +50 Koin.

### 2.2 Kebijakan Anti-Farming & Idempotensi Server
1. **Pemberian Hadiah Sekali Saja (*Once-Per-Node Policy*)**:
   Setiap transaksi hadiah dicatat dalam ledger append-only server berformat:
   `reward_events (userId, contentVersion, sourceNodeId, rewardType, amount, createdAt)`
   Constraint unik `(userId, contentVersion, sourceNodeId, rewardType)` memastikan pemain yang mengulang adegan cerita tidak melipatgandakan XP atau Koin.
2. **Batas Replay Harian**:
   Mini-game memiliki batas maksimum perolehan XP tambahan dari *replay* sebesar **35 XP per hari** kalender.

---

## 3. Perhitungan Streak Berbasis Zona Waktu `Asia/Jakarta`

Sistem streak Finspire dirancang adil tanpa bias zona waktu lokal klien:

1. **Jendela Kalender Bisnis**:
   Hari kalender dihitung dari pukul `00:00:00 WIB` (UTC+7) hingga `23:59:59 WIB` (UTC+7).
2. **Kondisi Penambahan Streak**:
   Pemain melakukan minimal 1 aktivitas terakreditasi (menyelesaikan 1 scene cerita ATAU 1 sesi mini-game) pada hari kalender berjalan.
   - Jika aktivitas tercatat pada `Hari (N)` dan aktivitas terakhir adalah `Hari (N-1)`: `Streak = Streak + 1`.
   - Jika aktivitas tercatat pada `Hari (N)` dan aktivitas terakhir sudah pada `Hari (N)`: `Streak tetap` (tidak bertambah dua kali di hari yang sama).
   - Jika pemain melewatkan 1 hari kalender:
     - Jika pemain memiliki saldo `Streak Freeze` aktif: 1 Streak Freeze dikonsumsi otomatis, `Streak dipertahankan`, Foxy menampilkan dialog lega.
     - Jika tidak memiliki Streak Freeze: `Streak di-reset ke 1`, Foxy masuk ke state `FX-WORRIED` lalu `FX-SAD` suportif.

---

## 4. Tabel Rekonsiliasi Saldo Chapter 1: KEEP IT ALIVE (PRESERVE)

- **Kondisi Awal**: Foxy memiliki dana mandiri terbatas sebesar **Rp10.000** untuk 7 hari.
- **Prinsip Utama**: Pelestarian dana (*preservation*) tanpa penambahan pemasukan buatan di tengah jalan (upah Day 5 ditiadakan demi menjaga kemurnian pedagogis dan integritas tema Chapter 4).
- **Persamaan Akuntansi Saldo**:
  $$Cash_{end} = Cash_{start} + \sum \Delta Cash \ge 0$$

### 4.1 Ringkasan Audit Distribusi Seluruh Jalur (Exhaustive Path Audit)
Berdasarkan penelusuran graf keputusan lengkap dari simpul awal `CH1-SC-01` hingga terminal dengan evaluasi berbasis status (*state-based mastery gating*):
- **Total Jalur Berhingga**: 159 jalur.
- **Jalur Lolos (*Pass / Survivor*)**: 140 jalur (88,1%) — Memenuhi kriteria evaluasi objektif `minCash: 1000` (saldo akhir berkisar Rp1.000 s.d. Rp10.000) dan berhasil menyusun *My 7-Day Money Survival Plan*.
- **Jalur Gagal Terbimbing (*Fail-Soft*)**: 19 jalur (11,9%) — Saldo akhir kritis di bawah cadangan aman (`maxCash: 999`, yaitu Rp0 atau Rp500) yang secara deterministik mengarahkan pemain ke simpul refleksi dan perbaikan strategi tanpa penalti.
- **Jalur Negatif / Tidak Valid**: **0 jalur (0,0%)** — Tidak ada satu pun kombinasi pilihan yang menghasilkan saldo minus. Saldo terendah yang dicapai adalah **Rp0**.

### 4.2 Contoh Jalur Keputusan Bijak (Optimal Path)
Jalur di mana pemain memprioritaskan kebutuhan sekolah dan menahan godaan konsumtif:

| Simpul (Scene ID) | Hari / Peristiwa | Pilihan Pemain | Delta (IDR) | Saldo Berjalan (IDR) | Status Foxy | Keterangan Pedagogis |
|---|---|---|---|---|---|---|
| `CH1-SC-01` | Day 1: Dahaga Siang | Bawa air minum sendiri dari rumah (1C) | Rp0 | Rp10.000 | `FX-HAPPY` | Menahan keinginan jajan demi menjaga dana mandiri utuh. |
| `CH1-SC-02` | Day 2: Iuran Fotokopi | Bayar iuran fotokopi tugas wajib (2A) | -Rp2.000 | Rp8.000 | `FX-IDLE` | Kebutuhan primer sekolah diselesaikan tanpa tunda. |
| `CH1-SC-03` | Day 3: Godaan Diskon | Tolak flash sale gantungan kunci (3B) | Rp0 | Rp8.000 | `FX-HAPPY` | Menghindari jebakan diskon barang non-esensial. |
| `CH1-SC-04` | Day 4: Pencatatan Pengeluaran | Beli buku saku koperasi (4B) | -Rp1.500 | Rp6.500 | `FX-HAPPY` | Pengeluaran produktif terjangkau untuk pencatatan mandiri. |
| `CH1-SC-05` | Day 5: Tinta Pena Habis | Beli isi ulang pena koperasi (5B) | -Rp1.000 | Rp5.500 | `FX-IDLE` | Memenuhi kebutuhan belajar mendesak dari cadangan kas. |
| `CH1-SC-06` | Day 6: Refleksi Cadangan | Tahan jajan, simpan sisa sebagai cadangan (6B)| Rp0 | Rp5.500 | `FX-HAPPY` | Disiplin menjaga saldo cadangan aman menjelang akhir pekan. |
| `CH1-SC-07` | Day 7: Evaluasi Boss | Serahkan *My 7-Day Money Survival Plan* | Rp0 | Rp5.500 | `FX-CELEBRATE` | Memenuhi syarat `minCash: 1000` (sisa Rp5.500), lolos ke `CH1-PASS-SURVIVOR`. |

### 4.3 Contoh Jalur Kritis (Impulse / Near-Deficit Path)
Jalur di mana pemain tergoda boba di hari pertama namun berhasil bertahan hidup lewat disiplin ketat:

| Simpul (Scene ID) | Hari / Peristiwa | Pilihan Pemain | Delta (IDR) | Saldo Berjalan (IDR) | Status Foxy | Keterangan Pedagogis |
|---|---|---|---|---|---|---|
| `CH1-SC-01` | Day 1: Dahaga Siang | Beli Es Boba kekinian (1A) | -Rp7.000 | Rp3.000 | `FX-WORRIED` | Saldo langsung berkurang 70% di hari pertama. |
| `CH1-SC-02` | Day 2: Iuran Fotokopi | Bayar iuran fotokopi tugas (2A) | -Rp2.000 | Rp1.000 | `FX-WORRIED` | Sisa saldo tinggal Rp1.000 untuk 5 hari ke depan. |
| `CH1-SC-03` | Day 3: Godaan Diskon | Tolak gantungan kunci karena saldo tipis (3B) | Rp0 | Rp1.000 | `FX-IDLE` | Belajar menahan diri akibat konsekuensi hari sebelumnya. |
| `CH1-SC-04` | Day 4: Pencatatan Pengeluaran | Gunakan kertas kalender bekas di rumah (4A) | Rp0 | Rp1.000 | `FX-HAPPY` | Beradaptasi memanfaatkan sumber daya tanpa belanja. |
| `CH1-SC-05` | Day 5: Tinta Pena Habis | Gunakan pensil cadangan yang ada (5A) | Rp0 | Rp1.000 | `FX-HAPPY` | Adaptasi kreatif mempertahankan kas tipis dari pengeluaran. |
| `CH1-SC-06` | Day 6: Refleksi Cadangan | Simpan Rp1.000 terakhir di saku (6B) | Rp0 | Rp1.000 | `FX-IDLE` | Bertahan dengan disiplin ekstrem. |
| `CH1-SC-07` | Day 7: Evaluasi Boss | Evaluasi akhir & pembuatan survival plan | Rp0 | Rp1.000 | `FX-CELEBRATE` | Memenuhi batas ambang minimum `minCash: 1000`, lolos ke `CH1-PASS-SURVIVOR`. |

---

## 5. Tabel Rekonsiliasi Saldo Chapter 2: PAY YOURSELF FIRST (PROTECT)

### 5.1 Model Ledger Multi-Pos & Persamaan Konservasi
Chapter 2 memperkenalkan pengelolaan uang terencana menggunakan 5 pos rekening mandiri:
1. `availableCash`: Kas harian yang siap dibelanjakan untuk kebutuhan operasional.
2. `goalSavings`: Tabungan target untuk pembelian aset produktif (blender es kopi).
3. `emergencyFund`: Dana darurat sebagai perisai finansial dari musibah tak terduga.
4. `debt`: Kewajiban utang eksplisit jika terjadi guncangan tanpa perisai darurat.
5. `acquiredAssets`: Nilai aset produktif yang telah berhasil dibeli tunai.

Setiap mutasi saldo wajib memenuhi **Hukum Konservasi Dana Multi-Pos**:
$$\text{Total Inflow} = \text{Available Cash} + \text{Goal Savings} + \text{Emergency Fund} + \text{Cumulative Expenses} + \text{Acquired Assets} - \text{Explicit Debt}$$

### 5.2 Ringkasan Audit Distribusi Seluruh Jalur Chapter 2
Berdasarkan penelusuran graf keputusan lengkap dari simpul awal `CH2-SC-01` hingga terminal dengan evaluasi berbasis status (*state-based mastery gating*):
- **Total Jalur Berhingga**: 40 jalur.
- **Jalur Lolos Proteksi (*Pass / Planner*)**: 8 jalur (20,0%) — Memenuhi syarat objektif bebas utang (`maxDebt: 0`, yaitu debt = Rp0) dan target perisai dana darurat terpenuhi (`minEmergencyFund: 50000`, yaitu Rp50.000 s.d. Rp65.000). Pemain menyusun cetak biru *Build Your Financial Shield*.
- **Jalur Gagal Terbimbing (*Fail-Soft*)**: 32 jalur (80,0%) — Terbagi secara deterministik ke dalam:
  - 8 jalur dengan kewajiban utang tertunggak (`minDebt: 1`, yaitu utang Rp15.000 akibat musibah yang belum dilunasi).
  - 24 jalur dengan defisit perisai proteksi (`maxDebt: 0, maxEmergencyFund: 49999`, yaitu dana darurat Rp25.000 s.d. Rp40.000 belum mencapai standar proteksi Rp50.000).
- **Jalur Negatif / Tidak Valid**: **0 jalur (0,0%)** — Tidak ada saldo kas, tabungan, atau dana darurat yang bernilai negatif.
- **Utang Negatif**: **0 jalur (0,0%)** — Pilihan pelunasan utang dilindungi oleh pra-syarat `minDebt: 15000`, memastikan utang tidak pernah minus.
- **Kepatuhan Konservasi Saldo**: **100% (40 dari 40 jalur)** terbukti memenuhi persamaan konservasi saldo multi-pos secara presisi tanpa ada selisih integer 1 rupiah pun.

### 5.3 Alur Rekonsiliasi Jalur Proteksi Unggul (Shielding Success)

- **Total Inflow Simulasi**: Rp300.000 (3 bulan x Rp100.000/bulan).
- **Kejadian Tak Terduga**: Bulan 1 ban sepeda bocor (Rp15.000), diserap langsung oleh pos `emergencyFund`.

| Bulan (Scene ID) | Mutasi Masuk & Keputusan | `availableCash` | `goalSavings` | `emergencyFund` | `debt` | `acquiredAssets` | Pengeluaran Kumulatif | Status Foxy | Keterangan Pedagogis |
|---|---|---|---|---|---|---|---|---|---|
| **Awal** | State inisial | Rp0 | Rp0 | Rp0 | Rp0 | Rp0 | Rp0 | `FX-IDLE` | Titik awal perencanaan. |
| **Bln 1 Masuk** (`CH2-SC-01`) | Inflow Rp100.000: Alokasi Blender Rp70k, Darurat Rp20k, Kas Rp10k | Rp10.000 | Rp70.000 | Rp20.000 | Rp0 | Rp0 | Rp0 | `FX-HAPPY` | Menerapkan *Pay Yourself First* di muka. |
| **Bln 1 Kejadian** (`CH2-SC-02`)| Ban bocor Rp15.000: Bayar dari Dana Darurat | Rp10.000 | Rp70.000 | Rp5.000 | Rp0 | Rp0 | Rp15.000 | `FX-HAPPY` | Perisai darurat melindungi kas & tabungan impian tetap utuh! |
| **Bln 2 Masuk** (`CH2-SC-03`) | Inflow Rp100.000: Alokasi Blender Rp70k, Darurat Rp20k, Kas Rp10k | Rp20.000 | Rp140.000 | Rp25.000 | Rp0 | Rp0 | Rp15.000 | `FX-HAPPY` | Mengisi kembali (*replenish*) perisai dana darurat. |
| **Bln 2 Godaan** (`CH2-SC-04`)| Godaan jaket thrift Rp60.000: Tunda demi target blender | Rp20.000 | Rp140.000 | Rp25.000 | Rp0 | Rp0 | Rp15.000 | `FX-HAPPY` | Menahan gratifikasi impulsif demi aset produktif. |
| **Bln 3 Masuk** (`CH2-SC-05`) | Inflow Rp100.000: Alokasi Blender Rp65k, Darurat Rp25k, Kas Rp10k | Rp30.000 | Rp205.000 | Rp50.000 | Rp0 | Rp0 | Rp15.000 | `FX-CELEBRATE` | Perisai darurat penuh (Rp50.000) dan tabungan impian kokoh. |
| **Bln 3 Boss** (`CH2-SC-06`) | Serahkan Blueprint *Build Your Financial Shield* | Rp30.000 | Rp205.000 | Rp50.000 | Rp0 | Rp0 | Rp15.000 | `FX-CELEBRATE` | Memenuhi syarat bebas utang dan dana darurat Rp50.000 (`CH2-PASS-PLANNER`). |

**Verifikasi Konservasi Angka Akhir**:
- $\text{Total Inflow} = \text{Rp300.000}$
- $\text{Available Cash} (\text{Rp30.000}) + \text{Goal Savings} (\text{Rp205.000}) + \text{Emergency Fund} (\text{Rp50.000}) + \text{Expenses} (\text{Rp15.000}) + \text{Assets} (\text{Rp0}) - \text{Debt} (\text{Rp0}) = \text{Rp300.000}$.
- **Selisih = Rp0 (Rekonsiliasi Sempurna)**.

### 5.4 Referensi Keputusan Pacing & Budgeting
Pacing dan alokasi multi-pos di atas dirancang sesuai **`DEC-CH2-PACING-MATH`** (Opsi 1: *Blueprint + Proyeksi Deterministik Bulan Berikutnya*) di `OPEN_DECISIONS.md`, menggantikan formula lama yang memaksakan pengeluaran 100% uang saku secara tidak realistis. Pada akhir Bulan 3, sistem perisai proteksi Rp50.000 telah terbentuk penuh dan saldo blender Rp205.000 diproyeksikan tuntas membeli blender (Rp250.000) pada Bulan 4 (membutuhkan Rp45.000 lagi dari inflow Rp100.000 Bulan 4).

