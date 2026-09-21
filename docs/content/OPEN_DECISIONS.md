# Daftar Keputusan Terbuka (Open Decisions Register)

Dokumen ini mencatat seluruh keputusan pedagogis, produk, dan arsitektur konten yang memerlukan persetujuan (*review gate*) dari stakeholder manusia sebelum diimplementasikan di kode backend dan engine.

---

## Ringkasan Keputusan & Dampak

| Decision ID | Topik Keputusan | Dampak Arsitektur / Engine | Status | Tingkat Urgensi |
|---|---|---|---|---|
| `DEC-CH1-SCOPE` | Cakupan Sumber Daya Simulasi Rp10.000 Ch1 | Narasi scene & pencegahan saldo minus | `PROPOSED` | Normal |
| `DEC-CH2-MATH` | *(Lama)* Asumsi Alokasi Khusus 3 Bulan Ch2 | State machine & formula rilis lama | `SUPERSEDED` | Tidak Aktif (Digantikan `DEC-CH2-PACING-MATH`) |
| `DEC-CH2-PACING-MATH` | Rekonsiliasi Matematika & Pacing Alokasi Chapter 2 | State machine multi-akun & konservasi saldo | `APPROVED` | Selesai (Disetujui Human Reviewer Opsi 1) |
| `DEC-BOSS-RETRY` | Kebijakan Percobaan Ulang (*Retry*) Boss Challenge | Aturan cooldown & idempotensi outbox | `APPROVED` | Selesai (Disetujui Human Reviewer Opsi 1) |
| `DEC-PASS-THRESH` | Ambang Batas Kelulusan Mini-Game & Boss | Evaluasi server-authoritative scoring | `PROPOSED` | Normal |
| `DEC-REWARD-POL` | Standarisasi Kebijakan Nilai Hadiah XP & Koin | Skema ledger hadiah & anti-farming | `PROPOSED` | Normal |
| `DEC-UNLOCK-RULE` | Prasyarat Pembukaan Chapter Berikutnya | Dependency graf progres antar chapter | `APPROVED` | Selesai (Disetujui Human Reviewer Opsi 1) |
| `DEC-MINIGAME-IN` | Aksesibilitas Input Non-Drag pada Mini-Game | Komponen interaksi & payload API input | `PROPOSED` | Normal |

---

## Rincian Keputusan Terbuka

### 1. `DEC-CH1-SCOPE`: Cakupan Sumber Daya Uang Simulasi Rp10.000 (Chapter 1)
- **Pertanyaan**: Apakah Rp10.000 untuk 7 hari disajikan sebagai seluruh biaya hidup atau pos alokasi sumber daya simulasi terbatas untuk melatih ketahanan finansial siswa?
- **Bukti Sumber**:
  - `PRD Finspire v3.0.docx` Section 7: *"Foxy hanya memiliki Rp10.000 untuk bertahan selama 7 hari... belajar bertahan dengan sumber daya terbatas dan memahami bahwa setiap keputusan finansial mempunyai konsekuensi."*
  - `REFERENSI PRESENTASI & PENJELASAN IDE.md` (Pertanyaan 29): Menegaskan bahwa Rp10.000 adalah batasan skenario simulasi, bukan klaim biaya hidup riil, dan kemiskinan tidak boleh dibingkai sebagai kegagalan pribadi.
- **Opsi**:
  - **Opsi 1**: Pos Sumber Daya Mandiri / Latihan Bertahan Hidup Siswa (Kebutuhan makan pokok/tempat tinggal diasumsikan terpenuhi di rumah; fokus menguji prioritas pengeluaran tambahan, kebutuhan sekolah mendadak, dan menahan godaan).
  - **Opsi 2**: Simulasi Kemiskinan Total (Mencakup biaya makan harian 3x).
- **Konsekuensi**: Opsi 2 sangat tidak realistis di Indonesia (Rp1.428/hari untuk makan 3x) dan berisiko bias etis menyalahkan siswa miskin.
- **Rekomendasi**: **Opsi 1 (Pos Sumber Daya Mandiri Pelajar)**.
- **Owner**: Hustler (Reifan) & Tim Pedagogi.
- **Status**: `PROPOSED`.

---

### 2. `DEC-CH2-MATH`: *(Lama - SUPERSEDED)* Asumsi Alokasi Khusus 3 Bulan Ch2
- **Catatan Status**: **SUPERSEDED** oleh `DEC-CH2-PACING-MATH`.
- **Alasan Penggantian**: Audit Fase 01R menemukan bahwa pemaksaan target blender Rp250.000 + dana darurat Rp50.000 dalam 3 bulan dari pemasukan Rp100.000/bulan dengan aturan 50/30/20 tidak valid secara matematis (mengalokasikan Rp115.000 dari pemasukan Rp100.000 dan mengabaikan biaya musibah Rp15.000). DOCX canonical tidak mewajibkan aturan 50/30/20 maupun batasan kaku 3 bulan.
- **Status**: `SUPERSEDED` (Dilarang direferensikan oleh simpul konten aktif).

---

### 3. `DEC-CH2-PACING-MATH`: Rekonsiliasi Matematika & Pacing Alokasi Chapter 2
- **Pertanyaan**: Bagaimana memodelkan matematika dan pacing alokasi Chapter 2 (inflow Rp100.000/bln, target blender Rp250.000, dana darurat Rp50.000) tanpa melanggar konservasi saldo atau memaksakan batas waktu yang bertentangan dengan arus kas nyata?
- **Bukti Sumber**:
  - `PRD Finspire v3.0.docx` Section 7: Foxy menerima Rp100.000/bulan dan ingin membeli blender Rp250.000 serta membangun dana darurat Rp50.000. Boss Project: *Build Your Financial Shield* (membuat target tabungan, target dana darurat, jumlah uang yang disimpan setiap menerima uang, aturan kapan dana darurat boleh digunakan).
  - Persamaan Konservasi Finansial:
    $$\text{Total Inflow} = \text{Available Cash} + \text{Goal Savings} + \text{Emergency Fund} + \text{Cumulative Expenses} + \text{Acquired Assets} - \text{Explicit Debt}$$
- **Opsi**:
  - **Opsi 1 (Cetak Biru Proteksi + Proyeksi Deterministik)**: Foxy menyusun cetak biru *Build Your Financial Shield* dan mengalokasikan uang selama 3 bulan pertama (mencapai dana darurat penuh Rp50.000 dan tabungan blender Rp205.000 setelah menyerap musibah ban sepeda Rp15.000). Pada Boss Challenge, pemain memproyeksikan penyelesaian target blender (Rp250.000) pada alokasi bulan ke-4 secara realistis dan bebas utang.
  - **Opsi 2 (Timeline Panjang 4–5 Bulan)**: Memperpanjang playable scene menjadi 4–5 bulan simulasi interaktif penuh sampai blender terbeli tunai di dalam game.
  - **Opsi 3 (Skenario 3 Bulan dengan Pendapatan Tambahan Canonical)**: Memaksakan pembelian blender selesai di bulan ke-3 hanya jika ada tambahan inflow canonical—namun PRD belum menyediakan sumber dana tambahan ini sebelum Chapter 4.
- **Konsekuensi**: Opsi 1 sepenuhnya setia pada narasi Boss Project DOCX tanpa menambah asumsi fiktif atau melanggar persamaan konservasi saldo. Opsi 2 menambah beban durasi permainan. Opsi 3 mengarang data di luar PRD.
- **Rekomendasi**: **Opsi 1 (Cetak Biru Proteksi + Proyeksi Deterministik Multi-Periode)**.
- **Owner**: Hacker (Fairuz) & Hustler (Reifan).
- **Status**: `APPROVED` (Disetujui oleh User/Human Reviewer pada 2026-09-21: Mengadopsi Opsi 1 Cetak Biru Proteksi + Proyeksi Deterministik Bulan Berikutnya).

---

### 4. `DEC-BOSS-RETRY`: Mekanik Percobaan Ulang (*Retry*) pada Boss Challenge
- **Pertanyaan**: Jika pemain gagal pada Boss Challenge, apa mekanisme percobaan ulangnya?
- **Bukti Sumber**:
  - `Finspire UIUX Storyboard Spec` Hal 15: Challenge gagal 3x memicu Foxy `FX-SAD` dengan dialog suportif.
  - `00-shared-contract.md` Bagian 4: Progres harus aman dan tidak menuntut hukuman destruktif (*fail-soft*).
- **Opsi**:
  - **Opsi 1 (Instant Retry dengan Review Hint)**: Pemain dapat langsung mencoba kembali setelah membaca kartu review evaluasi kesalahan.
  - **Opsi 2 (Time Cooldown / Energy System)**: Pemain harus menunggu beberapa menit atau menggunakan koin untuk mencoba kembali.
- **Konsekuensi**: Opsi 2 mengadopsi mekanisme *dark pattern* game komersial yang menghambat proses belajar siswa di sekolah.
- **Rekomendasi**: **Opsi 1 (Instant Retry dengan Review Hint & Foxy Support)**.
- **Owner**: Hipster (Faiz) & Hacker (Fairuz).
- **Status**: `APPROVED` (Disetujui oleh User/Human Reviewer pada 2026-09-21: Mengadopsi Opsi 1 Instant Retry dengan Corrective Hint & Foxy Support).

---

### 5. `DEC-PASS-THRESH`: Ambang Batas Kelulusan (*Pass Threshold*) Mini-Game & Boss
- **Pertanyaan**: Berapa skor minimum agar mini-game dan Boss Challenge dinyatakan selesai (*completed*)?
- **Bukti Sumber**:
  - `Finspire UIUX Storyboard Spec` Hal 12–14: Sortir Cepat memiliki batas waktu 60 detik.
  - `PRD Finspire v3.0.docx` Section 8.D: Mini-game latihan cepat 2–3 menit.
- **Opsi**:
  - **Opsi 1**: Akurasi minimal 80% (misal: 8 dari 10 item benar pada Sortir Cepat, dan kelengkapan 6 field artefak tanpa saldo minus).
  - **Opsi 2**: Akurasi 100% sempurna (*zero tolerance*).
- **Konsekuensi**: Opsi 2 dapat menimbulkan frustrasi kognitif tinggi bagi pelajar pemula.
- **Rekomendasi**: **Opsi 1 (Akurasi 80% untuk mini-game, dan pemenuhan kriteria rubrik serta non-defisit untuk Boss Challenge)**.
- **Owner**: Pedagogi & Hipster (Faiz).
- **Status**: `PROPOSED`.

---

### 6. `DEC-REWARD-POL`: Standarisasi Kebijakan Nilai Hadiah XP dan Koin
- **Pertanyaan**: Bagaimana membedakan nilai XP canonical dari PRD dan usulan Koin virtual, serta kebijakan replay?
- **Bukti Sumber**:
  - `PRD Finspire v3.0.docx` Section 8.B secara eksplisit menetapkan XP: +10 (scene), +25 (mini-game), +50 (Boss Challenge), +5 (baca microlearning), +100 (streak 7 hari).
  - Nominal Koin Foxy pada PRD adalah daftar penggunaan (outfit/dekorasi) tanpa nominal reward per node yang eksplisit.
- **Opsi**:
  - **Opsi 1 (Strict Canonical XP + Proposed Flat Coin)**: Menetapkan nilai XP persis sesuai PRD Section 8.B (+10, +25, +50, +5), menetapkan Koin sebagai proposal terukur (+5, +10, +30), dan menerapkan kebijakan `first_pass_only` untuk mencegah eksploitasi grinding/farming.
  - **Opsi 2 (Dynamic Reward)**: Nilai XP/Koin dinamis berdasarkan kecepatan waktu penyelesaian.
- **Konsekuensi**: Opsi 2 mendorong perilaku membaca terburu-buru (*skimming*) yang merusak retensi belajar.
- **Rekomendasi**: **Opsi 1 (Strict Canonical XP + Proposed Flat Coin, First Pass Only)**.
- **Owner**: Hacker (Fairuz).
- **Status**: `PROPOSED`.

---

### 7. `DEC-UNLOCK-RULE`: Aturan Pembukaan Chapter 2 (*Unlock Prerequisites*)
- **Pertanyaan**: Apakah pembukaan Chapter 2 hanya membutuhkan penyelesaian Boss Challenge Chapter 1, atau wajib memenuhi level/streak 3 hari?
- **Bukti Sumber**:
  - `PRD Finspire v3.0.docx` Section 7: Chapter 1 secara eksplisit menyatakan *"Hasil Chapter: Pengguna memperoleh identitas Survivor dan membuka Chapter 2."*
  - `PRD Finspire v3.0.docx` Tabel 8.B menulis syarat Level 2: "Selesai Ch1 + streak 3 hari".
  - `00-shared-contract.md` Bagian 1: Pilot fokus pada uji sosialisasi sekolah yang dapat diselesaikan dalam satu sesi kelas atau beberapa hari.
- **Opsi**:
  - **Opsi 1 (Mastery-Only Unlock)**: Chapter 2 terbuka segera setelah Boss Challenge Chapter 1 lulus (*completed*). Syarat streak 3 hari dialokasikan sebagai syarat level gamifikasi (Level 2 Pencatat Rajin) tanpa memblokir akses materi edukasi.
  - **Opsi 2 (Gated by Streak 3 Hari)**: Pemain wajib menunggu 3 hari berturut-turut untuk membuka Chapter 2.
- **Konsekuensi**: Jika menggunakan Opsi 2, sosialisasi atau pengujian Finspire di kelas sekolah (durasi 1–2 jam pertemuan) tidak akan pernah bisa menguji Chapter 2.
- **Rekomendasi**: **Opsi 1 (Mastery-Only Unlock: Lulus Boss Ch1 langsung membuka Ch2)**.
- **Owner**: Hustler (Reifan) & Hacker (Fairuz).
- **Status**: `APPROVED` (Disetujui oleh User/Human Reviewer pada 2026-09-21: Mengadopsi Opsi 1 Mastery-Only Unlock tanpa menunggu 3-day streak).

---

### 8. `DEC-MINIGAME-IN`: Aksesibilitas Input Alternatif Mini-Game
- **Pertanyaan**: Apakah mini-game wajib mendukung mode input tanpa seret (*non-drag*)?
- **Bukti Sumber**:
  - `Finspire UIUX Storyboard Spec` Hal 12, 26 (`AC-06`).
- **Opsi**:
  - **Opsi 1**: Wajib menyediakan mode tap (*Tap item -> Tap tombol kategori*).
  - **Opsi 2**: Hanya drag & drop.
- **Konsekuensi**: Opsi 1 menjamin kepatuhan WCAG 2.2 dan kelancaran di layar ponsel Android ekonomis.
- **Rekomendasi**: **Opsi 1 (Dual-mode: Drag & Drop + Accessible Tap-to-Select)**.
- **Owner**: Hipster (Faiz) & Hacker (Fairuz).
- **Status**: `PROPOSED`.
