# Prompt Fase 08 — VPS Production dan Operasi

Jalankan setelah Fase 07 disetujui. Artefak operasi dapat disiapkan sebelum VPS aktif; deployment aktual hanya jika akses dan izin tersedia.

---

Kamu bekerja di repository `finspire`. Siapkan deployment production pilot yang reproducible pada satu VPS menggunakan software open-source/gratis. Jangan meminta secret melalui chat dan jangan mengubah server remote tanpa otorisasi eksplisit.

## Mode dan preflight

1. Baca kontrak bersama, ADR operasi, threat model, test strategy, seluruh hasil Fase 03–07, dan guideline deployment proyek.
2. Pastikan candidate commit, content version, migration, backup compatibility, serta status fase sebelumnya jelas.
3. Baca `AGENTS.md` dan dokumentasi build/deployment Next.js lokal. Verifikasi runtime Node LTS yang didukung versi Next.js aktual; pin hasilnya, jangan mengikuti angka lama tanpa cek.
4. Jalankan seluruh verification suite lokal sebelum membuat release artifact.
5. Jika VPS/domain belum tersedia, kerjakan dan uji artefak lokal lalu beri status `BLOCKED_EXTERNAL` untuk live gates. Jangan memalsukan output server.
6. Jika VPS tersedia, lakukan inventory read-only tersanitasi: OS, CPU, RAM, disk, swap, port SSH, firewall, Node, PostgreSQL, Nginx, PM2, DNS. Jangan menampilkan IP/username/secret yang tidak perlu.

Sebelum `sudo`, firewall, DNS, package install, service restart, migration production, atau perubahan remote lain, pastikan tindakan diizinkan dan ada rollback. Jangan minta password/private key ditempel ke prompt.

## Artefak repository

Buat sesuai ADR dan filesystem target yang jelas:

- `.env.example`/production env inventory tanpa nilai;
- pin runtime (`.nvmrc`, `engines`, atau mekanisme approved);
- production Next standalone/build config bila terbukti sesuai;
- PM2 ecosystem untuk app user non-root, graceful shutdown, restart/memory policy dan log path;
- Nginx site template dengan placeholder tervalidasi;
- scripts/runbook deploy, migration lock, smoke, backup, verify, restore-to-temporary-DB, rollback;
- logrotate template;
- ops checklist dan incident runbook;
- load test script open-source tanpa credential hardcoded.

Script harus fail-fast, idempotent sejauh wajar, memakai target eksplisit, tidak menghapus direktori luas, tidak mencetak env, dan mempunyai dry-run/read-only mode bila relevan.

## Topologi/hardening

- Internet -> Nginx 80/443 -> Next.js pada loopback -> PostgreSQL loopback/private socket.
- Database dan port aplikasi tidak publik. Gunakan PostgreSQL SCRAM, least-privilege app role, dan migration privilege terpisah bila ADR menetapkan.
- App berjalan sebagai non-root. File secret/readable permissions minimum.
- Forwarded headers/trusted host/proxy benar; body/timeout/rate limit sesuai endpoint.
- Security headers tidak mematahkan PWA/WebM; service worker script mempunyai update/cache header yang benar.
- HTTPS gratis dengan Let's Encrypt/Certbot setelah DNS benar. Aktifkan HSTS hanya setelah HTTPS/renewal tervalidasi.
- Jangan mengaktifkan UFW sebelum memverifikasi port SSH aktif; pertahankan sesi recovery saat mengubah firewall.
- Server clock UTC; aplikasi menghitung business date `Asia/Jakarta` secara eksplisit.

## Deploy dan rollback

- Build/test dilakukan dari lockfile melalui `npm ci`; release mempunyai commit SHA/build ID/content version.
- Backup terverifikasi dibuat sebelum migration production.
- Migration dijalankan sekali dengan lock, terpisah dari PM2 worker start.
- Gunakan release directory/symlink atau mekanisme atomic yang approved; readiness harus hijau sebelum traffic penuh/reload.
- Uji graceful shutdown dan PM2 startup setelah reboot.
- Rollback code harus nyata dan menjaga schema compatibility; jangan menganggap down migration aman. Dokumentasikan expand/contract migration dan restore decision.
- Health live tidak tergantung DB; ready menjadi 503 ketika DB/migration tidak siap.

## Backup/restore

- Buat scheduled `pg_dump` custom format, checksum, timestamp UTC, retention, permission ketat, serta alert/manual check failure.
- Backup di disk VPS yang sama bukan disaster recovery. Sediakan prosedur ekspor terenkripsi ke media/lokasi lain yang dikendalikan tim tanpa mewajibkan layanan berbayar.
- Restore drill harus ke database sementara bernama/target eksplisit, tidak pernah menimpa production.
- Sesudah restore: verify checksum, schema/migration, row/invariant, auth sanitization, dan headless smoke journey.
- Ukur dan catat RPO/RTO hasil nyata, bukan target rekaan.

## Observability dan incident readiness

- Structured sanitized logs dengan request ID; tidak ada cookie/token/passphrase/Player Code/access code/body sensitif.
- Logrotate/disk threshold, PM2 status/restart loop, DB connection saturation, backup age, certificate renewal, readiness failure.
- Runbook minimal: deploy, rollback, reboot, DB unavailable, disk full, expired TLS, PM2 crash loop, migration failure, content revoke, service-worker incident, suspected credential leak, account deletion.
- Analytics/monitoring tidak boleh bergantung SaaS berbayar; gunakan system/log tooling self-hosted atau pemeriksaan operasional yang proporsional.

## Load/reliability test

- Jalankan terhadap local/staging seeded environment dulu dengan k6/autocannon/tool open-source approved.
- Jika ukuran cohort belum disetujui, ukur ramp 10 -> 30 -> 50 concurrent user dan laporkan kurva; jangan menetapkan kapasitas dari asumsi.
- Skenario mencakup bootstrap/read, content cache, login yang rate-limited, action/sync batch, reconnect burst, dan concurrent idempotency replay.
- Rekam p50/p95/p99, throughput, error rate, CPU/RAM/disk/DB connections/event loop, serta row/ledger integrity.
- Jangan load-test write production tanpa approval khusus.
- Integrity gate selalu mutlak: tidak ada duplicate decision/reward meskipun latency target tidak tercapai.
- Capacity PASS hanya terhadap target cohort yang sudah approved; selain itu laporkan measurement, bukan klaim.

## Live acceptance gate

- Fresh server/runbook reproducible; app/DB non-root dan port exposure sesuai.
- HTTPS valid, HTTP redirect, secure cookie/trusted origin, PWA install/offline smoke via HTTPS.
- PM2 graceful reload dan recovery sesudah reboot.
- Liveness/readiness benar saat DB hidup/mati.
- Backup checksum valid dan restore temporary DB lulus invariant/headless smoke.
- Code rollback rehearsal dan migration compatibility terbukti.
- Load/reconnect/idempotency test mempunyai bukti dan tidak merusak data.
- Tidak ada secret di git, report, logs, process arguments yang tidak semestinya.

Buat `docs/operations/` runbooks dan `docs/implementation/PHASE-08-STATUS.md`. Gunakan `PROPOSED`, `BLOCKED_EXTERNAL`, atau `REVIEW REQUIRED`; Antigravity tidak boleh self-approve.

## Handoff

Gunakan template handoff. Tambahkan inventory tersanitasi, public port evidence, exact release ID, TLS/PM2/reboot evidence, backup checksum + restore drill, load table, RPO/RTO, rollback result, serta external blockers. Jika VPS belum aktif, nyatakan dengan jelas bagian yang baru disiapkan versus benar-benar dijalankan. Jangan lanjut ke Fase 09.

---

