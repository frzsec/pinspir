# Matriks Bukti Sumber Konten (Source Evidence Matrix)

Dokumen ini memetakan seluruh klaim produk, pedagogi, dan teknis yang menjadi dasar perancangan konten Finspire, bersumber dari dokumen kanonikal **`PRD Finspire v3.0.docx`** (cermin markdown: `prdterbaru.md`) serta dokumen pendukung lainnya.

### Taksonomi Status Klaim:
- **`explicit`**: Tertulis gamblang di dokumen sumber kanonikal (`PRD Finspire v3.0.docx`).
- **`inferred`**: Penafsiran logis/ekstrapolasi berbasis bukti parsial yang diperlukan untuk menjamin keutuhan teknis/pedagogis.
- **`proposed`**: Usulan solusi arsitektur atau pedagogi baru yang dirancang untuk mengatasi inkonsistensi atau mengisi kesenjangan (memerlukan persetujuan produk/reviewer).
- **`superseded`**: Asumsi atau rumusan lama yang telah digantikan oleh bukti atau keputusan baru yang lebih kuat.
- **`missing`**: Informasi tidak tersedia di sumber atau spesifikasi belum didefinisikan sama sekali.
- **`excluded`**: Berkas atau data mentah yang dilarang dibaca/disalin demi privasi atau batasan etis.

---

## 1. Deklarasi Sumber Kanonikal & Judul Bab

Sumber rujukan otoritatif tertinggi untuk konten Finspire adalah berkas **`PRD Finspire v3.0.docx`** (Bagian 7: *Game-Based Interactive Storytelling*). Judul resmi, tema esensial, gelar identitas, dan artefak mastery adalah sebagai berikut:

| Chapter | Judul Kanonikal (DOCX) | Tema Esensial | Gelar Identitas (*Progression*) | Artefak Mastery (*My Financial Playbook*) |
|---|---|---|---|---|
| **Chapter 1** | **KEEP IT ALIVE** | **PRESERVE** (*Keep Your Money*) | `Survivor` | *My 7-Day Money Survival Plan* |
| **Chapter 2** | **PAY YOURSELF FIRST** | **PROTECT** (*Protect Your Money*) | `Planner` | *Build Your Financial Shield Blueprint* |
| **Chapter 3** | **DON'T ENTER THE TRAP** | **DEFEND** (*Protect Yourself*) | `Guardian` | *Build Your Financial Firewall* |
| **Chapter 4** | **BUILD YOUR MONEY ENGINE**| **PRODUCE** (*Create Money*) | `Value Creator` | *Earn Your First Money / Mini Business Blueprint* |
| **Chapter 5** | **BUILD WEALTH SLOWLY** | **GROW** (*Grow Money*) | `Wealth Builder`| *My Personal Money Constitution* |

---

## 2. Dokumentasi 6 Konflik Internal DOCX

Dalam analisis teliti terhadap `PRD Finspire v3.0.docx`, ditemukan 6 konflik internal yang memerlukan pencatatan formal dan perlakuan arsitektural:

| No | Konflik Internal DOCX | Lokasi Bagian Sumber | Uraian Pertentangan | Resolusi Rekonsiliasi (Fase 01R) |
|---|---|---|---|---|
| 1 | **Jumlah Level vs Jumlah Chapter** | Bagian 8.B (*Tabel Level Progression*) vs Bagian 7 (*Story Structure*) | Tabel level hanya mencantumkan hingga Level 4 (Bab 4 "Kemandirian Finansial"), padahal Bagian 7 mendefinisikan 5 chapter lengkap. | Ditetapkan 5 level & 5 chapter secara arsitektural; level 5 dimasukkan dalam roadmap post-pilot. |
| 2 | **Cakupan Flag Data Model** | Bagian 11 (*Data Model & Schema*) vs Bagian 7 (*Story Structure*) | Skema data model hanya mendefinisikan flag `ch1_completed` s.d. `ch4_completed`, meninggalkan `ch5_completed`. | Skema konten runtime dirancang generik berbasis koleksi chapter (`completedChapterIds: string[]`). |
| 3 | **Discrepancy Topik Chapter 5** | Bagian 16 (*Roadmap*) vs Bagian 7 (*Story Structure*) | Tabel roadmap menulis Chapter 5 sebagai "Pajak & Legalitas UMKM", sedangkan Bagian 7 mendefinisikannya sebagai "Psychology & Long-Term Wealth" / *BUILD WEALTH SLOWLY*. | Bagian 7 dijadikan rujukan pedagogis utama (*Psychology & Long-Term Wealth*); topik legalitas diposisikan sebagai modul pengayaan. |
| 4 | **Aturan Pembukaan Chapter (Streak vs Mastery)** | Bagian 7 (*Chapter Flow*) vs Bagian 8.B (*Level Table*) | Narasi Bagian 7 menyatakan lulus Chapter 1 langsung membuka Chapter 2; tabel Bagian 8.B mensyaratkan "Lulus Ch1 + 3 hari streak". | Diajukan dalam `DEC-UNLOCK-RULE`: Opsi 1 (*Mastery-only unlock*) direkomendasikan agar tidak menghambat demonstrasi di kelas/sosialisasi. |
| 5 | **Kategori Mini-Game 1 (2 vs 3 Kategori)** | Bagian 6 (*Core Loop*) vs Bagian 8.D (*Spesifikasi Mini-Game*) | Bagian 6 menyebut sortir 2 kategori ("Kebutuhan vs Keinginan"), sedangkan Bagian 8.D merinci 3 kategori ("Kebutuhan", "Keinginan", "Investasi Diri / Tabungan"). | Mengadopsi 3 kategori sesuai Bagian 8.D untuk memperkaya kedalaman pedagogis literasi keuangan. |
| 6 | **Pernyataan Uang Riil vs 100% Simulasi** | Bagian 7 (*Chapter 4 Text*) vs Bagian 1 (*Executive Summary*) | Bagian 7 Ch4 memuat frasa "potensi uang riil dari usaha es kopi", sedangkan Bagian 1 & etika menegaskan sistem 100% simulasi edukatif tanpa penarikan tunai (*cash out*). | Ditegaskan secara mutlak: 100% simulasi tanpa konversi uang kartal riil (*safety compliance*). |

---

## 3. Matriks Bukti Sumber Rinci

| No | Topik / Klaim Produk | Dokumen Sumber | Bagian / Halaman | Status | Implikasi Desain Konten |
|---|---|---|---|---|---|
| 1 | Target audiens 16–24 tahun dengan prioritas 16–17 tahun | `PRD Finspire v3.0.docx`<br>`REFERENSI PRESENTASI.md` | Bagian 4<br>Hal 2 | `explicit` | Nada bicara, studi kasus uang saku, dan skenario relevan untuk pelajar SMA/SMK awal. |
| 2 | Lingkup pilot playable dibatasi pada Chapter 1 dan 2 | `00-shared-contract.md`<br>`PRD Finspire v3.0.docx` | Bagian 1<br>Bagian 16 | `explicit` | Konten executable hanya diproduksi untuk Ch1 & Ch2; Ch3–Ch5 dicatat sebagai gap register masa depan. |
| 3 | Chapter 1: Uang simulasi Rp10.000 untuk 7 hari | `PRD Finspire v3.0.docx` | Bagian 7 (Ch1) | `explicit` | Menjadi tantangan bertahan hidup dasar (PRESERVE — KEEP IT ALIVE). |
| 4 | Definisi cakupan biaya dalam Rp10.000 selama 7 hari | `REFERENSI PRESENTASI.md`<br>`01-content-specification.prompt.md` | Tanya-Jawab 29<br>Hal 1 | `proposed` | Rp10.000 didefinisikan sebagai dana mandiri diskresioner/tambahan (bukan biaya hidup total/makan pokok) agar tidak menstigma kemiskinan (`DEC-CH1-SCOPE`). |
| 5 | Peniadaan upah kerja sampingan Day 5 Chapter 1 | `PRD Finspire v3.0.docx` | Bagian 7 (Ch1 vs Ch4) | `proposed` | Draft awal memberi upah Rp5.000 di Day 5. Ini dihapus agar Ch1 murni melatih preservasi uang tanpa suntikan dana, sekaligus menjaga tema menghasilkan uang tetap eksklusif untuk Ch4. |
| 6 | Chapter 2: Pemasukan simulasi Rp100.000/bulan | `PRD Finspire v3.0.docx` | Bagian 7 (Ch2) | `explicit` | Total arus kas masuk simulasi = Rp100.000/bulan. |
| 7 | Chapter 2: Target blender Rp250.000 + dana darurat Rp50.000 | `PRD Finspire v3.0.docx` | Bagian 7 (Ch2) | `explicit` | Total dana proteksi dan aset produktif = Rp300.000. |
| 8 | Asumsi lama alokasi 50/30/20 dan batasan 3 bulan pada Ch2 | Draft awal Fase 01 | `OPEN_DECISIONS.md` (lama) | `superseded` | Asumsi lama bahwa Ch2 harus selesai persis dalam 3 bulan dengan alokasi 100% uang saku telah digantikan oleh `DEC-CH2-PACING-MATH`. |
| 9 | Multi-account ledger & konservasi saldo Ch2 | Rekonsiliasi Fase 01R | Skema `chapter-02.json` | `proposed` | Mengelola saldo dalam 5 pos: `availableCash`, `goalSavings`, `emergencyFund`, `debt`, `acquiredAssets` dengan pelacakan mutasi eksplisit. |
| 10 | Mini-game Chapter 1: "Sortir Cepat" (3 Kategori) | `PRD Finspire v3.0.docx` | Bagian 8.D | `explicit` | Durasi 60 detik, kategorisasi item. Wajib memiliki alternatif tap non-drag untuk aksesibilitas. |
| 11 | Mini-game Chapter 2: "Dana Darurat" (Simulasi Alokasi) | `PRD Finspire v3.0.docx` | Bagian 8.D | `explicit` | Simulasi alokasi bulanan bertahan dari 3 musibah random. |
| 12 | State dan Mood Maskot Foxy | `PRD Finspire v3.0.docx` | Bagian 8.E | `explicit` | `FX-IDLE`, `FX-THINKING`, `FX-HAPPY`, `FX-WORRIED`, `FX-SAD`, `FX-CELEBRATE`, `FX-LEVEL-UP`, `FX-ERROR`. |
| 13 | Foxy netral saat pertimbangan pilihan | `Finspire UIUX Storyboard Spec` | Frame SB-CH1-002 | `inferred` | Foxy dilarang memberikan isyarat visual jawaban benar sebelum pemain men-submit keputusan. |
| 14 | Anti-farming dan integritas progres server-authoritative | `00-shared-contract.md` | Bagian 4 | `explicit` | Saldo, XP, dan koin hanya didapat sekali per node/challenge. Pengiriman ulang bersifat idempotent. |
| 15 | Spreadsheet survei mentah (Excel) di direktori parent | `00-shared-contract.md` | Bagian 2 | `excluded` | **DILARANG DIBUKA / DISALIN**. Berisi data pribadi (PII responden). |
| 16 | Chapter 4: Formula BEP Usaha Es Kopi | `PRD Finspire v3.0.docx` | Bagian 7 (Ch4) | `missing` | Rincian biaya tetap, biaya variabel per cup, dan estimasi volume harian belum ada di sumber. |

---

## 4. Klarifikasi Asumsi Draft Lama yang Telah Digantikan

Tiga asumsi dalam draft awal Fase 01 kini ditegaskan sebagai **asumsi draft perancang terdahulu, bukan batasan mutlak kanonikal**:
1. **Aturan 50/30/20 Bukan Berasal dari PRD DOCX**: Berkas kanonikal `PRD Finspire v3.0.docx` sama sekali TIDAK menyebutkan atau memuat formula 50/30/20. Frasa 50/30/20 murni merupakan asumsi eksternal tanpa dasar (*ungrounded*) yang disisipkan pada draf awal perancang, dan kini secara resmi dicabut/dinyatakan tidak berlaku.
2. **Batas Ketat 3 Bulan**: PRD mencontohkan ilustrasi target Rp300.000, tetapi tidak mewajibkan gameplay dibatasi kaku 3 putaran jika alokasi normal membutuhkan horizon waktu berbeda.
3. **100% Dedicated Target Fund**: Asumsi lama yang mengorbankan pos kebutuhan hidup demi mengejar angka Rp300.000 kini telah disupervisi oleh model multi-pos terpadu (`DEC-CH2-PACING-MATH`).
