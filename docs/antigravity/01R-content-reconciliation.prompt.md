# Prompt Fase 01R — Rekonsiliasi Content Pack dengan PRD Canonical

Salin isi prompt ini ke Antigravity sebagai satu tugas mandiri. Jalankan prompt ini terhadap output Fase 01 yang sudah ada; **jangan mengulang Fase 01 dari nol**.

---

Kamu bekerja di repository `finspire`. Output Fase 01 saat ini masih `PROPOSED`. Pengguna telah menetapkan `../PRD Finspire v3.0.docx` sebagai sumber canonical produk/konten terbaru, sehingga content pack lama wajib direkonsiliasi dan diaudit ulang sebelum Fase 02.

Scope fase ini hanya dokumentasi konten, JSON content pack, JSON Schema, dan validator konten. **DILARANG** mengimplementasikan UI, React, database, auth, API, service worker, PWA runtime, atau backend. Jangan menambah layanan berbayar, jangan membuat aset, dan jangan commit/push.

## Preflight wajib

1. Baca penuh:
   - `docs/antigravity/00-shared-contract.md`;
   - `../PRD Finspire v3.0.docx` sebagai sumber canonical;
   - `../prdterbaru.md` sebagai mirror Markdown;
   - `../Finspire UIUX Storyboard Interaction Spec v1.0.pdf` sebagai interaction spec;
   - seluruh file dalam `docs/content/`;
   - `content/schema/content-release.schema.json`;
   - seluruh file `content/releases/pilot-v1-draft/`;
   - `scripts/validate-content.mjs` dan script terkait di `package.json`.
2. Jalankan `git status --short`. Perubahan Fase 01 yang sudah ada adalah input pekerjaan; jangan menghapus atau menimpa perubahan di luar scope.
3. Pastikan rilis masih `draft/proposed` dan belum pernah menjadi rilis immutable `published`. Jika sudah dipublikasikan, STOP dan minta pembuatan versi rilis baru.
4. Buat matriks delta sebelum mengedit: `requirement canonical -> kondisi saat ini -> perubahan -> decision ID bila belum final`.
5. Jika DOCX dan mirror Markdown berbeda secara material, DOCX menang dan perbedaannya wajib dilaporkan.

## Temuan audit yang wajib direproduksi

Jangan mempercayai label `[STATUS] ALL CHECKS PASSED` dari validator lama sebelum membuktikan ulang hal berikut:

1. `scripts/validate-content.mjs` lama hanya mencetak path JSON Schema; schema tidak benar-benar dibaca dan diterapkan terhadap manifest/chapter.
2. Validator lama hanya memeriksa tipe integer delta, bukan konservasi saldo atau seluruh jalur. Audit independen menemukan 144 jalur Chapter 1: 57 pernah negatif, 49 berakhir negatif, dan minimum saldo -Rp11.000. Reproduksi angka tersebut secara independen sebelum memperbaiki.
3. Rekonsiliasi Chapter 2 lama tidak valid: satu bulan mengalokasikan Rp95.000 + Rp20.000 dari pemasukan Rp100.000, dan tiga pemasukan total Rp300.000 tidak dapat menghasilkan aset/tabungan akhir Rp300.000 setelah biaya darurat Rp15.000 tanpa inflow tambahan. Cabang tanpa dana darurat tetap dapat "menggunakan" dana darurat, utang Rp15.000 hanya muncul di prose, dan seluruh jalur mencapai teks sukses yang sama.
4. BFS lama hanya mendeteksi orphan, tidak membuktikan semua jalur finite/terminal, dan menerima exit Chapter 1/2 lintas chapter. Schema top-level juga tidak cocok dengan chapter yang disimpan sebagai file terpisah.
5. Klaim handoff lama tentang "seluruh hitungan tere-konsiliasi" dan "JSON Schema valid" dianggap gugur sampai validator baru dan audit jalur membuktikannya.

Catat reproduksi sebagai bukti sebelum/sesudah di handoff. Jangan sekadar mengubah teks laporan.

## Aturan otoritas

- DOCX canonical untuk visi produk, chapter, mastery, artifact, identity progression, dan persistent story.
- Keputusan terbaru pengguna dan shared contract mengalahkan contoh teknis lama di DOCX: versi repository aktual, offline-first, tanpa layanan berbayar, self-hosted bila layak, identitas pseudonim, dan kontrak aset maskot WebM transparan.
- Storyboard menentukan alur/interaksi, bukan naskah final dan bukan pengganti makna chapter canonical.
- Spreadsheet survei mentah dilarang dibuka, disalin, di-log, atau dimasukkan ke repository karena mengandung PII.
- Pilot playable tetap hanya Chapter 1–2. Chapter 3–5 hanya outline/gap register.
- Semua perubahan dan keputusan tetap `PROPOSED`. Antigravity tidak boleh menulis `APPROVED`.

## Perubahan canonical Chapter 1

Selaraskan Chapter 1 dengan kontrak berikut:

- judul `KEEP IT ALIVE`;
- tema `Survival & Financial Awareness`;
- Rp10.000 untuk tujuh hari sebagai sumber daya simulasi terbatas, bukan klaim biaya hidup realistis;
- materi: pencatatan sederhana, kebutuhan vs keinginan, prioritas, konsekuensi, menjaga cadangan, dan adaptasi terhadap kebutuhan tak terduga;
- Mastery Gate tidak boleh hanya berupa quiz atau saldo akhir; pemain harus memberi evidence alasan keputusan dan menunjukkan transfer ke kasus baru;
- Boss Project bernama `My 7-Day Money Survival Plan`;
- artifact terstruktur minimal memuat jumlah uang, kebutuhan utama, keinginan, batas pengeluaran, jumlah yang tetap disimpan, dan tindakan saat kebutuhan tak terduga muncul;
- setelah artifact dibuat, berikan transfer scenario baru untuk menguji penerapannya;
- identity hasil adalah `Survivor` dan unlock Chapter 2 tetap tunduk pada decision unlock aktif.

Hapus mekanik memperoleh pemasukan dari bekerja sebagai jalan sukses Chapter 1, termasuk pemasukan Rp5.000 di hari ke-5, karena progression canonical baru memperkenalkan penciptaan pendapatan pada Chapter 4. Ganti dengan pilihan yang tetap menguji `PRESERVE`, lalu rekonsiliasi ulang semua jalur.

Saldo kas tidak boleh menjadi negatif tanpa akun utang yang eksplisit. Pilihan yang tidak terjangkau harus ditolak, diarahkan ke fail-soft state, atau dimodelkan sebagai utang dengan konsekuensi—jangan hanya membiarkan angka kas minus.

## Perubahan canonical Chapter 2

Selaraskan Chapter 2 dengan kontrak berikut:

- judul `PAY YOURSELF FIRST`;
- tema dan Boss Project `Build Your Financial Shield`;
- pemasukan Rp100.000 per bulan;
- target blender Rp250.000 dan dana darurat Rp50.000;
- materi: Pay Yourself First, budgeting sederhana, dana darurat, delayed gratification, serta tabungan tujuan vs dana darurat;
- artifact terstruktur minimal memuat target tabungan, target dana darurat, jumlah yang disimpan setiap menerima uang, dan aturan kapan dana darurat boleh digunakan;
- identity progression menghasilkan `Planner`;
- skenario kebutuhan mendadak, diskon, ajakan teman, dan pengeluaran tak terduga boleh dipakai selama semua nilai terstruktur dan tere-konsiliasi.

Mini-game Chapter 2 harus menjadi simulasi alokasi uang yang menghadapi tiga kejadian/musibah, bukan sekadar kuis klasifikasi "Darurat Sah/Bukan Darurat".

Aturan 50/30/20, batas tiga bulan, dan asumsi bahwa seluruh Rp100.000 adalah pos tabungan khusus bukan lagi fakta canonical. Jangan mempertahankannya sebagai requirement tersembunyi.

Perbarui decision register untuk matematika/pacing Chapter 2. Minimal bandingkan:

1. Boss berupa rencana + proyeksi deterministik, tanpa memaksa pembelian selesai dalam jumlah bulan tertentu;
2. timeline tetap yang lebih panjang dengan inflow dan ruang pengeluaran eksplisit;
3. timeline tiga bulan hanya jika ada sumber dana tambahan canonical—jangan mengarang sumber tersebut.

Rekomendasikan opsi yang paling setia pada Boss Project di DOCX, tetapi tetap beri label `PROPOSED` sampai reviewer memilih. Setiap model harus memenuhi persamaan:

`total inflow = available cash + goal savings + emergency fund + expenses + acquired assets - explicit debt`

Transfer antar-pos tidak dihitung sebagai inflow atau expense baru. Inflow per periode hanya boleh diterapkan sekali.

## Mastery, artifact, dan persistent story

Perbarui `PILOT_CONTENT_SPEC.md`, JSON Schema, manifest, dan Chapter 1–2 agar memodelkan secara machine-readable:

- `masteryArtifact` dan versi artifact;
- field jawaban, tipe/batas input, rubric, pass condition, feedback, dan transfer scenario;
- evidence alasan pemain dalam bentuk pilihan terstruktur atau teks pendek dengan batas panjang;
- identity unlock;
- outcome tags yang diproduksi Chapter 1 dan kondisi naratif Chapter 2 yang mengonsumsinya;
- carry-forward yang tidak menggandakan uang, XP, koin, atau achievement;
- semua nominal dalam narasi sebagai structured effect, bukan angka prose tanpa dampak;
- pemisahan `inflow`, `expense`, `transfer`, `reward`, dan `asset acquisition`;
- untuk Chapter 2 minimal akun `availableCash`, `goalSavings`, `emergencyFund`, `debt`, dan `acquiredAssets`.

Jika nama field berbeda, dokumentasikan mapping yang eksplisit. Semua reference/ID harus stabil dan dapat divalidasi.

## Source evidence, governance, dan future gaps

Perbarui sekurangnya:

- `docs/content/README.md`;
- `docs/content/SOURCE_EVIDENCE.md`;
- `docs/content/PILOT_CONTENT_SPEC.md`;
- `docs/content/ECONOMY_AND_SCORING.md`;
- `docs/content/OPEN_DECISIONS.md`;
- `docs/content/STATUS.md`.

Gunakan klasifikasi evidence `explicit | inferred | proposed | superseded | missing`. Tetapkan DOCX sebagai canonical dan `prdterbaru.md` sebagai mirror. Tandai penyelesaian lama `DEC-CH2-MATH` sebagai tidak lagi disetujui/superseded, lalu pertahankan ID tersebut dengan opsi baru atau buat successor ID yang mempunyai tautan asal yang jelas. Tidak boleh ada `assumptionRef` aktif yang menunjuk keputusan superseded.

Selaraskan juga kebijakan reward: manifest saat ini menyatakan `first_pass_only`, sedangkan dokumentasi memberi reward replay. Pilih satu hanya melalui decision record. Nilai XP yang eksplisit dari PRD dan nominal Koin yang masih proposal harus dibedakan.

Pertahankan sebagai blocking sampai reviewer memutuskan:

- matematika/pacing Chapter 2;
- kebijakan retry Boss;
- unlock Chapter 2: mastery langsung vs syarat streak tiga hari.

Tinjau ulang decision lain, termasuk scope Rp10.000, pass threshold, reward, dan input non-drag. Bedakan angka XP yang eksplisit dari PRD dengan angka Koin yang masih proposal.

Outline Chapter 3–5 harus mengikuti DOCX tanpa membuat JSON playable:

- Chapter 3 `DON'T ENTER THE TRAP` — Financial Traps & Self-Control / Financial Firewall;
- Chapter 4 `BUILD YOUR MONEY ENGINE` — Business & First Income / Money Engine;
- Chapter 5 `BUILD WEALTH SLOWLY` — Psychology & Long-Term Wealth / Personal Money Constitution.

Catat, jangan selesaikan dengan asumsi, seluruh konflik internal DOCX berikut:

1. Section 7 mempunyai lima chapter, tetapi level system berhenti setelah Chapter 4.
2. Data model lama hanya mempunyai flag Chapter 1–4.
3. Roadmap menyebut Chapter 5 Pajak & Legalitas UMKM, sedangkan Section 7 menetapkan Psychology & Long-Term Wealth.
4. Chapter 1 menyatakan hasilnya membuka Chapter 2, tetapi level system mensyaratkan streak tiga hari.
5. Contoh Sortir Cepat di core loop memakai dua kategori, sedangkan tabel mini-game memakai tiga kategori termasuk Tabung.
6. Chapter 4 membuka kemungkinan penghasilan sungguhan, sedangkan Executive Summary menyatakan semua berada dalam simulasi.

## Validator dan regression test

Perbaiki `scripts/validate-content.mjs` tanpa dependency npm baru. Validator wajib:

- membaca dan menerapkan kontrak schema, bukan hanya mencetak path; bila hanya mendukung subset JSON Schema, dokumentasikan subset dan jangan mengklaim validasi penuh JSON Schema 2020-12;
- memvalidasi field wajib, tipe, enum, pattern, minimum/maximum, array cardinality, dan `additionalProperties` yang benar-benar digunakan schema;
- memeriksa seluruh reference, ID, decision ID aktif, asset key, producer/consumer outcome tag, artifact, rubric, pass condition, dan transfer scenario;
- menemukan orphan, dangling reference, cycle/reward loop tak terbatas, dan jalur tanpa terminal;
- mengenumerasi seluruh jalur finite Chapter 1–2 atau memakai pembuktian state yang ekuivalen;
- menerapkan setiap inflow sekali, lalu memeriksa konservasi nilai pada setiap langkah dan terminal;
- membedakan terminal pass, fail-soft, dan invalid; kas negatif tanpa utang eksplisit adalah invalid;
- memastikan transfer antar-pos tidak menciptakan/menghapus uang dan reward tidak dapat di-farm;
- melarang placeholder, secret, PII, serta URL aset palsu;
- menghasilkan output deterministic dan exit code non-zero pada kegagalan.

Pisahkan schema manifest/chapter atau gunakan `$defs` dan `$ref` yang benar agar setiap jenis file benar-benar dapat divalidasi. Terapkan nested `required`, `additionalProperties`, cardinality, state operation, precondition, completion outcome, artifact, rationale, persistent effect, unlock, dan scenario bank sesuai kebutuhan kontrak.

Tambahkan regression tests tanpa dependency baru yang minimal membuktikan validator gagal untuk:

1. required field hilang;
2. tipe/schema salah;
3. dangling node;
4. saldo negatif tanpa utang;
5. alokasi Rp115.000 dari inflow Rp100.000;
6. inflow diterapkan dua kali;
7. transfer antar-pos dihitung sebagai uang baru;
8. decision ID superseded masih direferensikan;
9. artifact/rubric/outcome consumer tidak lengkap.

Jangan memaksa jumlah scene lama jika struktur baru diperlukan untuk memenuhi canonical PRD.

## Verifikasi wajib

Jalankan dan laporkan output sebenarnya:

1. regression test validator;
2. `npm.cmd run content:validate` dua kali dan bandingkan outputnya;
3. parse seluruh JSON machine-readable;
4. audit enumerasi seluruh jalur dan rekonsiliasi nilai;
5. pencarian placeholder/secret/PII yang aman;
6. pemeriksaan bahwa `src/` tidak berubah dan tidak ada dependency baru;
7. `npm.cmd run lint`;
8. `npm.cmd run build`;
9. `git diff --check`;
10. `git status --short` dan `git diff --stat`.

## Acceptance gate

Fase 01R hanya layak diminta review jika:

- semua temuan audit lama berhasil direproduksi lalu ditutup dengan regression test;
- DOCX tercatat sebagai canonical dan aturan 50/30/20/tiga bulan tidak lagi diklaim sebagai fakta;
- Chapter 1–2 memenuhi mastery, artifact, identity, dan persistent-story contract;
- seluruh nominal terstruktur dan setiap jalur tere-konsiliasi;
- validator benar-benar menguji isi schema serta gagal pada fixture buruk;
- semua konflik sumber dan blocking decision terlihat jelas;
- status tetap `PROPOSED` / `REVIEW REQUIRED`;
- tidak ada perubahan pada `src/`, backend, UI, dependency, atau aset.

Jika satu syarat gagal, laporkan `BLOCKED` atau `REVIEW REQUIRED` secara jujur. Jangan lanjut ke Fase 02.

## Handoff

Gunakan persis struktur `docs/antigravity/HANDOFF_TEMPLATE.md`. Tambahkan:

- tabel delta sebelum/sesudah;
- bukti reproduksi seluruh temuan audit;
- jumlah jalur pass/fail/invalid untuk tiap chapter;
- persamaan rekonsiliasi Chapter 2;
- daftar decision ID aktif/superseded;
- semua command, exit code, dan ringkasan output nyata;
- verdict akhir `REVIEW REQUIRED`.

Koreksi fakta handoff lama: Chapter 1 aktual memiliki 15 choices, bukan 17; commit `68a15a0` adalah commit paket prompt sementara output Fase 01 masih berupa perubahan/untracked; dan `git diff --stat` tidak menghitung file untracked. Jangan menawarkan rollback berbasis `git clean -fd` karena dapat menghapus file kerja secara permanen.

Akhiri setelah handoff. Antigravity dilarang menjalankan Fase 02.

---
