# Spesifikasi Konten Pilot Finspire (Pilot Content Specification)

Dokumen ini mendefinisikan standar pedagogis, interaksi naratif, aturan bahasa, etika edukasi, dan kontrak logika permainan untuk **Finspire Production Pilot**, mengacu pada rujukan kanonikal **`PRD Finspire v3.0.docx`**.

---

## 1. Target Audiens & Standar Bahasa

### 1.1 Target Audiens
- **Segmen Utama**: Remaja usia 16–17 tahun (Siswa SMA/SMK sederajat).
- **Segmen Sekunder**: Pemuda usia 18–24 tahun yang baru memasuki bangku kuliah atau memulai usaha mandiri/pekerjaan pertama.
- **Karakteristik Finansial**:
  - Menerima uang saku harian atau mingguan dari orang tua/wali, atau memiliki pemasukan sampingan kecil (jualan daring, jasa kreatif).
  - Mengalami dorongan sosial (*peer pressure*), godaan gaya hidup (*FOMO, jajan boba/kopi kekinian*), dan belum terbiasa menyiapkan cadangan dana darurat.

### 1.2 Tone & Voice (Bahasa Indonesia)
- **Nada Bicara**: Ramah, hangat, suportif, kasual tetapi sopan, dan berorientasi refleksi (*growth mindset*).
- **Gaya Bahasa Foxy**: Seperti sahabat sebaya yang sama-sama belajar mengelola uang. Foxy menggunakan kata sapaan akrab ("Halo teman!", "Yuk kita hitung bareng!", "Wah, hampir saja!") tanpa menggunakan bahasa gaul yang berlebihan atau cepat usang (*cringe*).
- **Prinsip Bebas Rasa Malu (*Shame-Free Feedback*)**:
  Ketika pemain memilih opsi yang merugikan atau boros, penjelasan **DILARANG** menyalahkan, mengejek, atau memberi label buruk (*"Kamu boros banget!"*, *"Pilihan bodoh!"*). Sebaliknya, feedback fokus menjelaskan mekanisme sebab-akibat:
  > *"Es boba memang enak dan bikin segar hari ini, tapi saldo kita berkurang Rp7.000. Artinya untuk 6 hari ke depan sisa uang kita tinggal Rp3.000. Kalau ada kebutuhan tugas sekolah besok, kita harus cari akal lain."*

### 1.3 Aksesibilitas & Readability
- **Panjang Teks**: Maksimal 2–3 kalimat pendek per balon dialog untuk memastikan keterbacaan pada layar ponsel.
- **Microlearning**: Maksimal 3 kartu per topik, menggunakan struktur analogi konkret sehari-hari.
- **Kontras & Format**: Teks narasi tidak boleh berdasar pada pembedaan warna semata; status benar/korektif selalu disertai ikon dan label tekstual jelas.

---

## 2. Definisi Core Game Loop & Struktur Konten

### 2.1 Alur Siklus Bermain (Core Loop)
```text
[Buka Aplikasi]
       │
       ▼
[Story Scene (1-2 scene)] ──► Pemain memilih aksi berdasarkan situasi Foxy
       │
       ▼
[Consequence & Feedback]  ──► Update saldo simulasi & Foxy bereaksi sesuai pilihan
       │
       ▼
[Microlearning Card]      ──► Penjelasan singkat konsep (analogi praktis)
       │
       ▼
[Mini-game / Challenge]   ──► Latihan aktif 1-2 menit
       │
       ▼
[Reward & Progress]       ──► XP, Koin virtual, Streak hari ini
       │
       ▼
[Kembali Esok Hari / Nudge]
```

### 2.2 Hirarki & Terminologi Node Konten
1. **Chapter**: Fase besar pembelajaran tematik (misal: Chapter 1: *KEEP IT ALIVE*).
2. **Day / Milestone**: Bagian narasi yang merepresentasikan episode waktu atau tahapan cerita.
3. **Scene**: Unit interaktif terkecil berisi konteks latar, dialog Foxy, dan 2–3 pilihan tindakan (*choices*).
4. **Choice**: Opsi keputusan pemain yang memiliki nilai *intent*, mutasi saldo simulasi (*stateOperations* / *transfers*), dan rujukan *consequence*.
5. **Consequence**: Hasil langsung keputusan yang mengubah kondisi dunia cerita dan saldo Foxy.
6. **Microlearning**: Kartu penjelasan konsep edukatif ringkas (1–2 kalimat kunci + 1 contoh kontekstual).
7. **Mini-game**: Latihan mekanik interaktif cepat untuk memperkuat pemahaman konsep (misal: Sortir Kebutuhan vs Keinginan).
8. **Boss Challenge**: Ujian penutup chapter berupa skenario terintegrasi tanpa bantuan instan (*mastery gate*).
9. **Mastery Artifact**: Hasil nyata terstruktur dari penyelesaian boss challenge (misal: *My 7-Day Money Survival Plan*) yang disimpan ke dalam *My Financial Playbook*.
10. **Transfer Scenario**: Soal evaluasi dengan kasus dan tokoh baru untuk membuktikan pemahaman konseptual nyata, bukan sekadar menghafal alur cerita game.

---

## 3. Learning Objectives per Chapter

### Chapter 1: KEEP IT ALIVE (PRESERVE — Keep Your Money)
- **Tema Sentral**: Menjaga uang tetap utuh dan bertahan hidup dari keterbatasan anggaran tanpa berutang.
- **Tujuan Pembelajaran (LO-1.1)**: Siswa mampu mengidentifikasi perbedaan esensial antara **Kebutuhan** (hal pokok yang jika tidak dipenuhi mengganggu fungsi sekolah/hidup) dan **Keinginan** (hal yang menyenangkan tetapi bisa ditunda).
- **Tujuan Pembelajaran (LO-1.2)**: Siswa mampu menghitung dampak pengeluaran hari ini terhadap fleksibilitas sisa uang di hari-hari berikutnya (*opportunity cost*).
- **Tujuan Pembelajaran (LO-1.3)**: Siswa mampu mencatat pos pengeluaran sederhana agar mengetahui ke mana uang mengalir (*money tracking*).
- **Desain Pacing Narasi**:
  - Saldo awal: **Rp10.000** untuk 7 hari (dana mandiri diskresioner).
  - Peniadaan upah kerja sampingan di Day 5: Day 5 difokuskan pada pengeluaran tak terduga kebutuhan sekolah (tinta pena habis) dan strategi preservasi mandiri, menjaga mekanik menghasilkan uang tetap eksklusif untuk Chapter 4.
- **Boss Project**: *My 7-Day Money Survival Plan* (Merancang pembagian uang saku 7 hari dan melewati situasi tak terduga tanpa saldo minus).
- **Progression Title**: Gelar `Survivor` & Badge Survivor.

### Chapter 2: PAY YOURSELF FIRST (PROTECT — Protect Your Money)
- **Tema Sentral**: Memprioritaskan proteksi masa depan di awal (*Pay Yourself First*) sebelum belanja konsumtif.
- **Tujuan Pembelajaran (LO-2.1)**: Siswa mampu menerapkan prinsip alokasi anggaran terencana (menyisihkan tabungan proteksi di muka saat menerima uang saku/pemasukan).
- **Tujuan Pembelajaran (LO-2.2)**: Siswa memahami fungsi **Dana Darurat** sebagai perisai finansial saat terjadi kejadian tak terduga (seperti ban sepeda bocor) agar tidak perlu berutang.
- **Tujuan Pembelajaran (LO-2.3)**: Siswa mampu mempraktikkan penundaan kepuasan sesaat (*delayed gratification*) demi mencapai tujuan jangka menengah yang lebih bernilai (alat produksi usaha).
- **Desain Pacing Narasi & Multi-Account Ledger**:
  - Pemasukan simulasi: **Rp100.000/bulan**.
  - Pelacakan multi-pos: `availableCash`, `goalSavings`, `emergencyFund`, `debt`, `acquiredAssets`.
  - Kejadian tak terduga di Bulan 1: Ban sepeda bocor (Rp15.000) diselesaikan langsung menggunakan dana darurat yang telah disisihkan di awal, membuktikan efektivitas perisai finansial secara nyata.
- **Boss Project**: *Build Your Financial Shield Blueprint* (Merancang alokasi proteksi, target tabungan darurat, dan uji ketahanan terhadap 3 guncangan acak).
- **Progression Title**: Gelar `Planner` & Badge Perencana Handal.

---

## 4. Evaluasi Pemahaman & Transfer Scenarios

Untuk memisahkan antara *engagement* (XP/streak) dan *bukti pemahaman nyata*, setiap chapter dilengkapi **Transfer Scenarios**. Skenario transfer menggunakan tokoh dan situasi di luar Foxy:

### 4.1 Skenario Transfer Chapter 1: Kasus Uang Saku Riko
- **Konteks**: Riko memiliki sisa uang saku Rp15.000 untuk 3 hari sekolah ke depan. Pulang sekolah, teman-temannya mengajak beli es boba seharga Rp12.000 karena ada promo diskon 50%.
- **Pertanyaan**: Apa konsekuensi paling tepat jika Riko memutuskan membeli es boba tersebut?
- **Opsi Jawaban**:
  1. *Riko berhemat karena memanfaatkan diskon besar boba.* [Salah: Bias ilusi diskon]
  2. *Sisa uang Riko tinggal Rp3.000 untuk 3 hari ke depan, sehingga ia sangat rentan kesulitan jika ada iuran fotokopi atau ongkos mendesak.* [Benar: Memahami opportunity cost & prioritas kebutuhan]
  3. *Riko tidak perlu pusing karena besok bisa meminta tambahan uang saku ke orang tua.* [Salah: Mengabaikan batasan anggaran mandiri]
- **Feedback Edukatif**: Membeli barang keinginan saat diskon bukanlah penghematan apabila menghabiskan pos anggaran kebutuhan dasar yang terbatas.

### 4.2 Skenario Transfer Chapter 2: Dilema Tabungan Konser Sari
- **Konteks**: Sari menerima uang saku bulanan Rp200.000. Sari ingin membeli tiket festival musik seharga Rp150.000 bulan depan, namun saat ini ia memiliki saldo tabungan darurat Rp0.
- **Pertanyaan**: Berdasarkan prinsip *Pay Yourself First* dan proteksi keuangan, langkah apa yang paling bijak dilakukan Sari?
- **Opsi Jawaban**:
  1. *Langsung memakai Rp150.000 untuk beli tiket sekarang, sisa Rp50.000 dipakai jajan seadanya.* [Salah: Mengabaikan perisai proteksi]
  2. *Menyisihkan minimal Rp40.000 untuk dana darurat terlebih dahulu, lalu menabung bertahap untuk konser berikutnya atau mencari alternatif hiburan terjangkau.* [Benar: Mendahulukan proteksi sebelum keinginan]
  3. *Meminjam uang teman Rp150.000 untuk tiket konser agar uang saku utuh.* [Salah: Mengambil utang konsumtif]
- **Feedback Edukatif**: Prinsip *Pay Yourself First* mengajarkan bahwa keamanan diri dari musibah tak terduga lebih utama daripada hiburan sesaat yang menghabiskan seluruh cadangan dana.

---

## 5. Mekanik Mini-Game & Boss Challenge

### 5.1 Mini-Game Chapter 1: Sortir Cepat
- **Format**: Pengelompokan barang ke dalam 3 kategori: `Kebutuhan`, `Keinginan`, `Investasi Diri / Tabungan`.
- **Waktu**: 60 detik.
- **Aksesibilitas Wajib**: Mekanisme tap non-drag (*ketuk item -> pilih tombol kategori*) sebagai alternatif setara geser (*drag & drop*).
- **Kriteria Lolos**: Minimal 8 dari 10 item dikelompokkan dengan benar (Akurasi 80%).

### 5.2 Mini-Game Chapter 2: Dana Darurat (Simulasi Alokasi & Guncangan)
- **Format**: Mengatur persentase alokasi bulanan (Belanja, Tabungan Target, Dana Darurat) dan menguji daya tahannya terhadap 3 musibah acak.
- **Kriteria Lolos**: Saldo kas dan dana darurat tidak boleh minus saat menghadapi musibah.

### 5.3 Aturan Fail-Soft & Retry Boss Challenge
- **Fail-Soft Guarantee**: Kegagalan pada Boss Challenge **TIDAK PERNAH** menghapus progres akun, tidak menurunkan level, dan tidak memotong XP yang telah diperoleh.
- **Mekanik Percobaan (Instant Retry)**:
  - Gagal 1x / 2x: Foxy memberikan umpan balik evaluatif pada pos mana yang mengalami defisit.
  - Gagal 3x: Foxy masuk ke state `FX-SAD` suportif dan memberikan modul peninjauan singkat (*guided hint*) sebelum mengizinkan pemain mengulang kembali.
- **Anti-Farming Server-Authoritative**: XP (+50) dan Koin (+30) boss challenge hanya diberikan 1 kali saat kelulusan pertama. Replay berikutnya bersifat idempotent.

---

## 6. Kontrak Mood & State Maskot Foxy

| State Key | Label Status | Trigger Utama | Perilaku Visual & Suasana |
|---|---|---|---|
| `FX-IDLE` | Netral / Tenang | Kondisi standby membaca cerita | Bernapas tenang, mata berkedip wajar, tidak mendistraksi teks bacaan. |
| `FX-THINKING` | Menimbang | Layar pertanyaan aktif, pemain sedang memilih | Pose berpikir netral. **Dilarang** memberi isyarat memihak pada salah satu opsi. |
| `FX-HAPPY` | Senang / Bangga | Keputusan bijak dipilih / Streak aktif | Tersenyum ramah, mengacungkan jempol atau melambai ringan. |
| `FX-WORRIED` | Khawatir | Saldo simulasi menipis kritis / Guncangan tak terduga | Menepuk dahi/kaki, alis berkerut khawatir, mengajak pemain berhati-hati. |
| `FX-SAD` | Sedih Suportif | Challenge gagal 3x / Mengalami defisit keuangan | Duduk lesu namun tetap tersenyum tipis; dialog menyemangati untuk bangkit kembali. |
| `FX-CELEBRATE` | Perayaan | Berhasil menyelesaikan Boss Challenge / Lulus Chapter | Melompat gembira, perayaan kelulusan chapter. |
| `FX-LEVEL-UP` | Peningkatan Diri | Ambang batas XP tercapai | Animasi pencapaian tingkat baru. |
| `FX-ERROR` | Gangguan Sistem | Penyimpanan gagal / Jaringan terputus | Wajah bingung menunjuk kabel/perangkat; pesan jelas menyalahkan sistem, bukan pemain. |

---

## 7. Kebijakan Keamanan, Etika Finansial, & Perlindungan Anak

1. **Pencegahan Keterlibatan Finansial Nyata**:
   - Finspire tidak pernah meminta data rekening bank, PIN, kartu debit/kredit, atau data finansial nyata.
   - Simulasi uang dibatasi pada angka cerita terisolasi tanpa nilai tukar ke uang nyata.
2. **Pedoman Materi Pinjol & Perjudian Daring (Safety Rules)**:
   - Dilarang menampilkan brand pinjol ilegal nyata, tautan unduhan pinjol/judi, atau mekanik taruhan yang menimbulkan *dopamine rush*.
3. **Financial Disclaimer Formal**:
   > *"Finspire adalah media simulasi edukasi literasi keuangan dan bukan penyedia nasihat investasi, perencana keuangan tersertifikasi, atau lembaga pembiayaan. Semua karakter, cerita, dan nominal di dalam aplikasi adalah rekaan untuk tujuan pembelajaran."*

---

## 8. Outline & Gap Register Chapter 3–5 (Roadmap Post-Pilot)

### 8.1 Chapter 3: DON'T ENTER THE TRAP (DEFEND — Protect Yourself)
- **Tema & Tujuan**: Membangun pertahanan terhadap penipuan digital, pinjol ilegal, bahaya judi daring, dan jebakan gaya hidup impulsif (*FOMO*).
- **Gelar Identitas**: `Guardian`
- **Artefak Mastery**: *Build Your Financial Firewall*
- **Rencana Boss Challenge**: *Selamatkan 3 Teman* (memberikan intervensi literasi pada teman yang menghadapi tawaran pinjol, judol, dan belanja FOMO).
- **Kesenjangan Konten (Gap Register)**:
  1. *Naskah Dialog Detail*: Belum ada rincian adegan scene-by-scene.
  2. *Etika Visual*: Perlu panduan kurasi agar visual peringatan judol/pinjol tidak menimbulkan efek adiksi pada siswa di bawah umur.
  3. *Formula Bunga Berbunga*: Perlu spesifikasi formula integer bunga harian pinjol ilegal.

### 8.2 Chapter 4: BUILD YOUR MONEY ENGINE (PRODUCE — Create Money)
- **Tema & Tujuan**: Menghasilkan uang melalui usaha mandiri, membedakan omzet vs profit, menghitung biaya tetap dan variabel, serta mencapai titik impas (*Break Even Point*).
- **Gelar Identitas**: `Value Creator`
- **Artefak Mastery**: *Earn Your First Money / Mini Business Blueprint*
- **Rencana Boss Challenge**: *Bulan Pertama Usaha* (30 hari operasional es kopi menuju target BEP).
- **Kesenjangan Konten (Gap Register)**:
  1. *Model Finansial BEP*: Klaim PRD v3.0 bahwa BEP tercapai pada hari ke-25 belum dilengkapi rincian biaya tetap (sewa tempat/listrik), biaya variabel per cup, dan volume penjualan harian.
  2. *Granularitas Skenario 30 Hari*: Format simulasi 30 hari (harian vs mingguan checkpoint) belum diputuskan.

### 8.3 Chapter 5: BUILD WEALTH SLOWLY (GROW — Grow Money)
- **Tema & Tujuan**: Psikologi kekayaan jangka panjang, kekuatan bunga majemuk (*compound interest*), instrumen investasi legal dasar, dan kekebalan terhadap skema cepat kaya (*get-rich-quick scams*).
- **Gelar Identitas**: `Wealth Builder`
- **Artefak Mastery**: *My Personal Money Constitution*
- **Kesenjangan Konten (Gap Register)**:
  1. *Resolusi Topik*: Menyelesaikan discrepancy Bagian 16 (Pajak UMKM) vs Bagian 7 (Psychology of Wealth).
  2. *Formula Compound Interest*: Perlu penyusunan formula proyeksi pertumbuhan nilai riil dengan integer IDR.


