# Paket Prompt Antigravity — Finspire Production Pilot

Paket ini memecah implementasi Finspire menjadi fase kecil yang dapat diaudit. Urutannya sengaja dimulai dari **content specification**, lalu **arsitektur**, baru implementasi. Tujuannya adalah production pilot untuk sosialisasi sekolah, bukan demo sekali jalan.

## Cara memakai

1. Kerjakan di branch khusus dan pastikan worktree bersih atau perubahan yang ada sudah dipahami.
2. Berikan **satu prompt fase saja** kepada Antigravity. Jangan gabungkan semua fase menjadi satu mega-prompt.
3. Antigravity wajib membaca [`00-shared-contract.md`](./00-shared-contract.md), sumber proyek, dan artefak fase sebelumnya sebelum mengubah apa pun.
4. Pada akhir fase, Antigravity harus berhenti di gate, menjalankan verifikasi yang diminta, dan mengisi [`HANDOFF_TEMPLATE.md`](./HANDOFF_TEMPLATE.md).
5. Tinjau diff, keputusan, serta bukti tes. Manusia/Codex yang menyatakan fase `APPROVED`; Antigravity tidak boleh menyetujui hasilnya sendiri.
6. Hanya setelah gate lulus, commit fase tersebut lalu lanjutkan ke prompt berikutnya.

Jika Antigravity tidak dapat membaca file di luar folder `finspire`, salin sumber yang dibutuhkan ke konteks percakapan **tanpa** memasukkan spreadsheet survei mentah atau PII ke repository.

## Urutan fase dan gate

| Fase | Prompt | Hasil utama | Boleh lanjut jika |
|---|---|---|---|
| 01 | [`01-content-specification.prompt.md`](./01-content-specification.prompt.md) | Kontrak konten terstruktur dan konten pilot Ch1–2 berstatus draft | Semua inkonsistensi terungkap; keputusan produk yang memblokir sudah disetujui |
| 02 | [`02-architecture-contract.prompt.md`](./02-architecture-contract.prompt.md) | ADR, ERD, API, protokol sync, threat model, strategi tes | Tidak ada keputusan arsitektur blocking; kontrak saling konsisten |
| 03 | [`03-foundation-database.prompt.md`](./03-foundation-database.prompt.md) | Fondasi server, PostgreSQL/Drizzle, migrasi, seed, observability dasar | Fresh migration dan seed terbukti; build/typecheck/test lulus |
| 04 | [`04-auth-privacy-security.prompt.md`](./04-auth-privacy-security.prompt.md) | Identitas pseudonim, sesi, consent, RBAC, ekspor/hapus akun | Skenario abuse dan otorisasi utama lulus |
| 05 | [`05-game-engine-idempotency.prompt.md`](./05-game-engine-idempotency.prompt.md) | Mesin aturan server-authoritative, ledger hadiah, idempotensi | Retry/concurrency/replay tidak menggandakan progres atau hadiah |
| 06 | [`06-offline-first-sync.prompt.md`](./06-offline-first-sync.prompt.md) | PWA, IndexedDB, outbox, cache dan sinkronisasi | E2E offline–reload–online lulus, termasuk sesi kedaluwarsa dan konflik |
| 07 | [`07-content-api-completeness.prompt.md`](./07-content-api-completeness.prompt.md) | Rilis konten pilot, API pemain/sekolah, analytics minimal | Ch1–2 dapat diselesaikan headless melalui API dan hasilnya deterministik |
| 08 | [`08-vps-production.prompt.md`](./08-vps-production.prompt.md) | Deployment/runbook VPS, TLS, backup/restore, rollback | Rehearsal dan smoke test lulus; eksekusi VPS menunggu akses nyata |
| 09 | [`09-final-audit.prompt.md`](./09-final-audit.prompt.md) | Audit GO/NO-GO berbasis bukti | Semua blocker produksi ditutup atau verdict tetap NO-GO |

## Aturan operasional

- Jangan lanjut otomatis ke fase berikutnya.
- Jangan menerima jawaban “sudah selesai” tanpa daftar diff dan output perintah verifikasi.
- Commit per fase agar rollback dan review mudah.
- UI visual, motion final, dan integrasi desain Figma ditunda. Fase ini boleh membuat shell/debug UI minimum hanya bila diperlukan untuk menguji PWA/offline.
- Aset maskot final akan berupa WebM transparan. Backend cukup menyiapkan kontrak state/aset; jangan membuat atau mengarang aset final.
- Semua solusi harus dapat dijalankan dengan software open-source/self-hosted dan tanpa layanan berbayar. “Gratis” tidak berarti mengabaikan biaya domain, backup di luar VPS, waktu operasional, atau batas kapasitas.
- Fase 08 dapat menyiapkan seluruh konfigurasi sekarang, tetapi deployment aktual baru dilakukan ketika akses VPS, domain, dan secret tersedia.

## Mulai sekarang

Mulai dari [`01-content-specification.prompt.md`](./01-content-specification.prompt.md). Jangan mengimplementasikan database atau endpoint sebelum content gate dan architecture gate disetujui.

