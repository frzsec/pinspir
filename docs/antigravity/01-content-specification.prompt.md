# Prompt Fase 01 — Content Specification dan Draft Pilot

Salin isi prompt ini ke Antigravity sebagai satu tugas mandiri.

---

Kamu bekerja di repository `finspire`. Tugasmu hanya mengubah kebutuhan produk menjadi **content specification yang executable dan dapat direview** untuk production pilot. Jangan mengimplementasikan UI, database, auth, API, service worker, atau backend pada fase ini.

## Preflight wajib

1. Baca seluruh `docs/antigravity/00-shared-contract.md` dan patuhi prioritas sumbernya.
2. Baca `AGENTS.md`, `package.json`, dan inventaris singkat repository agar output sesuai kondisi nyata.
3. Baca penuh sumber berikut, bukan hanya nama filenya:
   - `../Finspire UIUX Storyboard Interaction Spec v1.0.pdf`
   - `../prdterbaru.md`
   - bagian produk/teknis yang relevan dari `../REFERENSI PRESENTASI & PENJELASAN IDE.md`
   - gunakan `../FINSPIRE PRESENTATION.pdf` hanya sebagai konteks sekunder.
4. Jangan membuka atau menyalin isi spreadsheet survei mentah. Cukup catat bahwa file tersebut excluded karena PII.
5. Jalankan `git status --short`. Jangan menimpa perubahan yang tidak kamu buat.
6. Tulis ringkasan evidence: apa yang benar-benar dinyatakan sumber, apa yang hanya inferensi, dan apa yang belum tersedia.

Jika PDF/sumber utama tidak dapat dibaca, atau ada diff tumpang tindih, STOP sesuai kontrak bersama.

## Fakta yang tidak boleh disamarkan

- Storyboard adalah interaction spec, bukan story script lengkap. Ia menyebut detail scene per hari/episode masih perlu dibuat terpisah.
- Roadmap MVP memprioritaskan Chapter 1 dan 2; jangan membuat Chapter 3–5 seolah siap produksi.
- “Rp10.000 untuk 7 hari” belum menjelaskan biaya apa yang termasuk. Tantangan tidak boleh memberi pesan bahwa kemiskinan adalah kegagalan pribadi.
- Chapter 2 menyebut pemasukan Rp100.000/bulan selama 3 bulan, target blender Rp250.000 + dana darurat Rp50.000, tetapi juga contoh menabung 20%. Dua puluh persen dari Rp300.000 hanya Rp60.000; aturan ini belum konsisten.
- Angka BEP Chapter 4 belum memiliki biaya tetap, biaya variabel, dan volume yang cukup untuk dihitung. Itu future content gap, bukan sesuatu yang boleh ditebak.
- XP, koin, badge, streak, dan completion adalah engagement/progress, bukan bukti pemain sudah paham.

## Tujuan fase

Hasil fase harus memisahkan dengan tegas:

1. fakta dari sumber;
2. aturan konten yang sudah dapat ditetapkan;
3. working assumption untuk membuat draft dapat dijalankan;
4. keputusan produk/pedagogi yang perlu approval;
5. konten yang belum ditulis.

Jangan bertanya satu per satu sebelum bekerja. Susun seluruh draft dan decision register terlebih dahulu. Gunakan rekomendasi terbaik sebagai varian `PROPOSED`, tetapi jangan menandainya final.

## Artefak yang harus dibuat

### A. Dokumentasi di `docs/content/`

1. `README.md`
   - tujuan pilot dan batas Chapter 1–2;
   - cara membaca/memvalidasi content pack;
   - lifecycle `DRAFT -> REVIEWED -> APPROVED -> PUBLISHED -> RETIRED`;
   - aturan bahwa published release immutable;
   - daftar semua artefak dan owner review yang dibutuhkan.
2. `SOURCE_EVIDENCE.md`
   - matrix requirement/claim, sumber, halaman/section, status `explicit|inferred|missing`, dan implikasi;
   - jangan mengutip panjang dari sumber.
3. `PILOT_CONTENT_SPEC.md`
   - audience, tone Bahasa Indonesia, accessibility/readability;
   - core loop dan definisi scene/day/attempt/choice/consequence;
   - learning objectives per chapter;
   - aturan feedback yang menjelaskan alasan, bukan mempermalukan;
   - pre/post atau transfer question yang mengukur penerapan pada kasus baru;
   - mini-game, boss challenge, retry, fail-soft, completion, reward, badge, unlock;
   - Foxy mood/state contract (`idle`, `thinking`, `happy`, `worried`, `sad`, `celebrate`) tanpa aset final;
   - safety rules untuk konten pinjol/judol, minors, dan financial disclaimer.
4. `ECONOMY_AND_SCORING.md`
   - seluruh formula integer dan contoh hitung;
   - sumber XP/koin, batas per attempt, anti-farming, streak berbasis `Asia/Jakarta`;
   - bedakan simulated money, virtual coin, dan XP;
   - tabel rekonsiliasi saldo untuk setiap jalur draft Chapter 1–2;
   - jangan memakai angka yang tidak dapat direkonsiliasi.
5. `OPEN_DECISIONS.md`
   - ID stabil, pertanyaan, evidence, opsi, konsekuensi, rekomendasi, owner, status;
   - minimal memuat scope biaya Ch1, matematika Ch2, retry boss, pass threshold, nilai reward, dan aturan unlock;
   - tandai `BLOCKING` bila keputusan mengubah state machine atau canonical calculation.
6. `STATUS.md`
   - set status hanya `PROPOSED`;
   - checklist reviewer konten, pedagogi, produk, dan engineering;
   - tempat reviewer manusia mengubahnya menjadi `APPROVED`. Kamu dilarang melakukan approval sendiri.

### B. Kontrak machine-readable

Buat:

- `content/schema/content-release.schema.json` memakai JSON Schema 2020-12;
- `content/releases/pilot-v1-draft/manifest.json`;
- `content/releases/pilot-v1-draft/chapter-01.json`;
- `content/releases/pilot-v1-draft/chapter-02.json`;
- bila lebih bersih, pisahkan bank assessment/minigame ke file yang direferensikan manifest.

Schema dan data minimal harus memodelkan:

- stable ID dan schema/content/protocol version;
- locale `id-ID`, lifecycle status, release timestamp nullable, source references, dan assumption IDs;
- chapter metadata, prerequisites, learning objectives, badge/unlock;
- ordered scene graph dengan start node dan terminal;
- narrative beats/dialogue, speaker, optional Foxy state, content warning bila relevan;
- choices dengan raw player intent, consequence key, next node, feedback pedagogis, dan delta simulasi yang divalidasi;
- minigame/boss definition, prompt, answer/rubric, attempts, pass rule, retry consequence;
- reward policy reference, transfer question, accessibility text;
- asset logical keys saja—tidak boleh mengarang URL WebM final;
- status `draft/proposed` pada semua konten yang belum disetujui.

Semua ID harus stabil dan human-readable, bukan bergantung pada array index. Nominal uang adalah integer rupiah.

### C. Isi draft pilot

1. Chapter 1 harus memiliki draft lengkap 7 hari/scene utama, jalur pilihan, consequence, microlearning, transfer question, dan Boss Challenge. Jelaskan dengan eksplisit bahwa Rp10.000 adalah **scope uang simulasi yang ditentukan**, bukan seluruh biaya hidup, sesuai working assumption yang direkomendasikan.
2. Chapter 2 harus memiliki draft alur lengkap budgeting/dana darurat dan challenge 3 bulan. Buat tabel beberapa opsi rekonsiliasi untuk inkonsistensi target, pilih satu hanya sebagai `PROPOSED`, dan tautkan semua node yang bergantung padanya ke decision ID.
3. Narasi boleh ditulis sebagai working draft yang layak direview, tetapi tidak boleh diklaim sebagai naskah asli/final pengguna.
4. Setiap choice harus memberi trade-off yang masuk akal. Hindari satu jawaban “baik” yang terlalu jelas dan jawaban lain yang sekadar konyol.
5. Setiap jalur harus berakhir; tidak boleh ada dangling reference, unreachable required node, atau reward loop.
6. Chapter 3–5 hanya mendapat outline/gap register di dokumentasi. Jangan menghasilkan production content untuk fase tersebut.

### D. Validator tanpa dependency baru

Buat `scripts/validate-content.mjs` menggunakan Node built-in saja. Validator harus:

- parse seluruh JSON;
- memeriksa version/status dan field wajib terpenting;
- memastikan ID unik lintas release;
- memastikan seluruh reference/next node/asset key/decision ID valid;
- menemukan orphan/unreachable node dan branch tanpa terminal;
- memeriksa nominal/delta integer serta kalkulasi saldo yang dideklarasikan;
- mendeteksi reward tanpa policy key;
- gagal jika release draft diberi status `published` atau mengandung placeholder diam-diam seperti `TODO`, `TBD`, string kosong, atau URL aset final palsu;
- menghasilkan output deterministic dan exit code non-zero saat gagal.

Tambahkan script package seperti `content:validate` hanya jika diperlukan; jangan menambah package npm.

## Batas implementasi

- Jangan menyentuh `src/`, UI, route, DB schema, auth, service worker, atau config deployment.
- Jangan membuat asset gambar/video.
- Jangan memasukkan PII, hasil survei mentah, secret, atau klaim riset baru.
- Jangan merapikan file lain di luar scope.

## Verifikasi wajib

Jalankan dan laporkan hasil sebenarnya:

1. validator konten minimal dua kali untuk membuktikan output deterministic;
2. JSON parse seluruh file machine-readable;
3. pencarian placeholder/secret/PII pattern yang aman;
4. pemeriksaan bahwa tidak ada perubahan dalam `src/` dan tidak ada dependency baru;
5. `npm run lint` dan `npm run build` (gunakan `npm.cmd` di PowerShell bila perlu);
6. `git diff --check`, `git status --short`, dan `git diff --stat`.

## Acceptance gate

Fase hanya layak diminta review jika:

- evidence, assumption, dan draft text dapat dibedakan;
- Ch1 dan Ch2 structurally complete serta semua graph/reference valid;
- seluruh hitungan yang dipakai draft tere-konsiliasi;
- inkonsistensi sumber tidak disembunyikan;
- semua keputusan yang memengaruhi backend memiliki decision ID;
- validator lulus;
- status masih `PROPOSED` dan daftar blocking decision jelas;
- tidak ada perubahan runtime/backend/UI.

Jika ada blocking decision, itu hasil fase yang sah: tulis opsi dan rekomendasinya lalu STOP untuk approval. Jangan lanjut ke arsitektur.

## Handoff

Gunakan persis struktur `docs/antigravity/HANDOFF_TEMPLATE.md`. Tambahkan daftar decision ID yang harus dijawab reviewer dan sertakan contoh satu jalur Ch1 serta satu rekonsiliasi Ch2. Akhiri setelah handoff; jangan menjalankan Fase 02.

---
