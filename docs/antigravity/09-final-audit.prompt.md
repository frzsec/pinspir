# Prompt Fase 09 — Final Production Readiness Audit

Jalankan hanya pada candidate commit/deployment yang akan dipakai pilot.

---

Kamu adalah auditor terakhir Finspire, bukan implementer fitur. Lakukan audit read-only terhadap kode/server/data sejauh aman, lalu hanya tambahkan laporan audit. Jika menemukan defect, berikan reproduction dan verdict; jangan memperbaiki source secara diam-diam karena itu mengubah candidate dan mewajibkan audit ulang.

## Preflight

1. Baca kontrak bersama, semua approval/status/handoff, requirement traceability, content release, architecture/ADR/threat model/test strategy, dan runbook operasi.
2. Catat commit SHA, lockfile hash/build ID, migration head, content version/checksum, environment, URL target, dan waktu audit tanpa menyalin secret.
3. Pastikan Fase 01–08 benar-benar approved. Jika live gate Fase 08 masih `BLOCKED_EXTERNAL`, verdict maksimum `NO-GO` untuk produksi walau audit lokal dapat dilanjutkan.
4. Jalankan `git status --short`. Candidate harus reproducible; jelaskan setiap diff/generated file.

## Audit wajib

### A. Reproducibility

- clean checkout/worktree terkontrol dan `npm ci` dari lockfile;
- validator content/architecture, lint, typecheck, unit, integration, contract, browser E2E, production build;
- database kosong migrate+seed/publish; seed kedua no-op;
- upgrade path dari baseline sebelumnya bila ada;
- server production artifact start dan health smoke.

### B. Security/privacy

- tracked file/history secret scan yang aman, dependency audit lalu triage exploitability—jangan blind major-upgrade;
- cookie/session/revoke, CSRF/origin/CORS/trusted host, rate/body/batch limit, security headers/HTTPS;
- BOLA/IDOR antar pemain, teacher lintas cohort, admin boundary;
- tampered reward/progress, injection/mass assignment, unsafe error/log detail;
- consent enforcement, export/delete, retention/minimization, shared-device/account-switch exposure;
- port/process/database/backup permissions dan log redaction.

### C. Data integrity dan concurrency

Ulangi dengan PostgreSQL nyata:

- double tap dan 20 concurrent duplicate;
- ID sama payload berbeda;
- lost response setelah commit dan batch replay;
- out-of-order/stale revision;
- dua device memilih berbeda;
- expired auth lalu same-account/different-account login;
- content version berubah saat run;
- retry mini-game/boss/chapter completion;
- ledger/projection reconciliation dan reward/achievement/unlock tepat sekali.

### D. Offline/PWA

- install/bootstrap online, hard reload offline, play/resume offline, close/reopen, reconnect/sync;
- throttling/flapping dan partial batch;
- service worker update dengan pending outbox;
- quota/blocked IDB migration/eviction recovery;
- corrupt/revoked content pack;
- logout/shared device/account isolation;
- missing/corrupt/offline WebM fixture dan fallback;
- audit Cache Storage memastikan response privat tidak ada;
- browser matrix termasuk keterbatasan iOS/Background Sync dinyatakan jujur.

### E. Konten/journey

- editorial approval dan published checksum;
- graph/reference/math invariant Ch1–2;
- headless success, fail/retry, resume, online, dan offline journey;
- Chapter 2 attainable sesuai angka approved;
- expected simulated cash/XP/koin/badge/unlock sama dengan ledger;
- jangan menganggap completion/retention sebagai bukti learning impact.

### F. Operasi

- HTTPS, external port, PM2 graceful reload/reboot recovery;
- DB unavailable -> readiness 503 dan no corrupt write;
- backup age/checksum dan restore drill ke temporary DB;
- restored headless journey, code rollback, migration recovery;
- TLS renewal, logrotate/disk capacity, incident runbook;
- load/reconnect burst terhadap approved cohort target atau measurement matrix;
- no duplicate invariant selama load.

### G. Pilot rehearsal

Gunakan akun/data test pseudonim: create/enroll/consent, bootstrap, Ch1, offline interruption, reconnect, Ch2, achievement, optional teacher summary/leaderboard, logout/login, export/delete, lalu verifikasi DB/ledger/log sesuai policy.

## Severity dan verdict

- `P0`: auth bypass, cross-account/cohort leak, unrecoverable data loss, reward/progress corruption luas, secret exposure, deployment unusable.
- `P1`: core Ch1–2, auth, offline sync, migration, backup/restore, HTTPS, atau rollback gagal.
- `P2`: masalah non-blocking dengan workaround aman dan owner jelas.
- `P3`: polish/optimization/documentation minor.

Verdict:

- `GO`: P0=0, P1=0, semua mandatory gate benar-benar PASS, content sign-off ada, backup+restore+rollback dan live HTTPS/offline terbukti.
- `GO WITH CONDITIONS`: hanya P2/P3, setiap item punya mitigasi, owner, dan deadline sebelum/selama pilot; tidak boleh dipakai untuk bukti mandatory yang belum dijalankan.
- `NO-GO`: ada P0/P1, hasil wajib belum dijalankan, content belum approved, VPS/TLS belum aktif, restore/rollback belum terbukti, atau candidate berubah sesudah tes.

## Output

Buat `docs/release/PRODUCTION_READINESS.md` yang memuat:

- candidate identity/environment/scope dan exclusions;
- requirement-to-evidence matrix;
- exact command/skenario, exit code, timestamp, dan artifact/log path tersanitasi;
- temuan dengan severity, reproduction, impact, recommendation, owner/status;
- security/privacy, integrity, offline/browser, content, operations, backup/restore/rollback, dan load summaries;
- known limitations serta pilot-day go/no-go checklist;
- verdict dan alasan yang dapat ditelusuri.

Jangan menulis “production-ready” bila verdict bukan `GO`. Jangan mengubah source/config/migration untuk memperbaiki temuan; keluarkan `NO-GO` atau condition yang sah dan minta fase remediation terpisah, kemudian audit ulang candidate baru.

## Handoff

Respons akhir memakai heading `PHASE 09 FINAL AUDIT`, verdict, candidate IDs, jumlah P0/P1/P2/P3, mandatory gate table, exact commands, top findings, backup/restore/rollback, load/offline summary, conditions/owner/deadline, dan `git status --short`. Ikuti pula `docs/antigravity/HANDOFF_TEMPLATE.md` untuk bagian audit trail.

---

