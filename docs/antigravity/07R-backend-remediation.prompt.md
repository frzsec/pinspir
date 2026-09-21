# Prompt Fase 07R — Remediasi Backend Production Pilot

Gunakan prompt ini sebagai corrective pass setelah audit backend independen. Prompt ini mengizinkan perubahan **backend Finspire saja** untuk memperbaiki defect yang tercantum, tetapi tidak memberikan status `APPROVED`, `GO`, atau izin deployment.

---

Kamu adalah senior backend engineer dan security reviewer Finspire. Perbaiki backend berdasarkan bukti audit di bawah sampai invariant, tes regresi, dan dokumentasi konsisten. Jangan mengejar sekadar tes hijau. Hasil akhir harus dapat dipakai sebagai candidate baru yang kemudian diaudit ulang.

## 0. Dokumen wajib dan sumber kebenaran

Baca penuh sebelum mengubah apa pun:

1. `docs/antigravity/00-shared-contract.md`
2. `docs/antigravity/HANDOFF_TEMPLATE.md`
3. `docs/content/STATUS.md`, `docs/content/OPEN_DECISIONS.md`, dan release content terkait
4. `docs/architecture/STATUS.md`, seluruh ADR, OpenAPI, threat model, test strategy, dan traceability matrix
5. `docs/implementation/PHASE-03-STATUS.md` sampai status terakhir yang benar-benar ada
6. `docs/antigravity/03-foundation-database.prompt.md` sampai `07-content-api-completeness.prompt.md`
7. `AGENTS.md`, `package.json`, lockfile, schema/migration, Route Handler, engine, sync handler, serta seluruh tes aktual

Urutan sumber kebenaran tetap mengikuti shared contract. Corrective pass ini tidak boleh dipakai untuk mengarang approval fase yang belum diberikan.

## 1. Kondisi awal audit yang harus direproduksi

Audit dilakukan pada commit awal `665645f` dan mendapatkan baseline berikut:

- `npm.cmd test`: PASS, 34 test total
- `npm.cmd run typecheck`: PASS
- `npm.cmd run lint`: PASS
- `npm.cmd run build`: PASS
- PostgreSQL nyata memang dipakai oleh integration test, tetapi cakupan tes melewatkan defect produksi di bawah.

Reproduksi minimal yang telah menunjukkan bug:

- Chapter 2, pilihan `ch2-c1-balanced`, melaporkan delta `+100000`, tetapi semua akun tetap `0`.
- Boss menerima artifact sembarang `{a,b,c}` dan transfer answer `"anything"`, lalu memberi skor `100/100`.
- Attempt yang dilanjutkan dalam batch/request baru mulai lagi dari `initialAccounts`.
- Headless journey dapat menyelesaikan Chapter 2 dengan melompati scene cerita.

Jangan menghapus atau melonggarkan tes lama hanya agar implementasi baru lulus.

## 2. Batas perubahan keras

- Fokus hanya backend, database, kontrak API/content, test fixture backend, dan dokumentasi status terkait.
- **DILARANG** mengerjakan UI final, styling, Figma, maskot/WebM, animasi, atau polish visual.
- **DILARANG** mengimplementasikan service worker, IndexedDB/outbox browser, atau UI offline dalam corrective pass ini. Catat Fase 06 client offline sebagai gate terpisah yang belum selesai.
- Jangan mengaktifkan VPS, domain, TLS, layanan eksternal, atau deployment.
- Tetap gratis/self-hosted. Jangan menambah SaaS, trial, email/SMS/OTP berbayar, Redis/cloud wajib, atau kebutuhan kartu kredit.
- Jangan commit atau push.
- Jangan membaca, mencetak, atau mengimpor spreadsheet survei ber-PII.
- Jangan mengubah migration `0000_odd_the_captain.sql` jika pernah diterapkan. Semua koreksi schema memakai migration additive berikutnya (`0001+`) dengan jalur upgrade dan rollback yang terdokumentasi.
- Jangan menulis `APPROVED`, memalsukan checklist, atau mengubah hasil `FAIL/BLOCKED` menjadi `PASS` tanpa bukti.

## 3. Preflight keselamatan — kerjakan sebelum source change

1. Catat branch, commit, `git status --short`, migration head, Node/npm/PostgreSQL version, dan nama database tersanitasi.
2. Pastikan test hanya boleh memakai database disposable dengan nama berakhiran `_test`. Tambahkan guard yang **menolak keras** test/migrate/seed destructive jika:
   - `NODE_ENV !== "test"` untuk test integration;
   - URL test kosong;
   - nama database tidak berakhiran `_test`;
   - test URL sama dengan `DATABASE_URL` non-test.
3. Hapus seluruh fallback URL PostgreSQL dan password `fairuz` dari source, config, script, dan test. `DATABASE_URL`/`TEST_DATABASE_URL` wajib eksplisit dan aplikasi harus fail-fast. Jika credential itu pernah dipakai di luar database lokal disposable, laporkan kewajiban rotasi tanpa menuliskan secret baru.
4. Buat reproduction test yang gagal untuk defect P0/P1 sebelum memperbaikinya. Simpan output awal secara tersanitasi.
5. Audit status fase. Buat corrective status baru; jangan retroaktif mengesahkan status `PROPOSED`. Ketiadaan `PHASE-06-STATUS.md` dan eksekusi Fase 07 sebelum Fase 06 harus dilaporkan sebagai process gap.

## 4. Remediasi wajib

### A. Konfigurasi dan keamanan database

1. Hilangkan fallback credential dari `src/lib/config/env.ts`, `drizzle.config.ts`, script, dan test.
2. Pisahkan config runtime, migration, seed, dan integration test secara eksplisit. Jangan pernah diam-diam jatuh ke database test.
3. Tambahkan connection/query timeout yang wajar, pool limit yang terdokumentasi, dan cleanup deterministik pada test.
4. Readiness harus memeriksa koneksi, migration/schema compatibility, serta ketersediaan content release yang valid tanpa membocorkan DSN/error internal.
5. Tes migrate+seed dari database kosong dan upgrade dari migration `0000`; seed kedua harus idempotent atau gagal secara eksplisit bila bytes/version bertentangan.

### B. Auth, sesi, CSRF, dan shared device

ADR-002 memilih Better Auth. Saat ini package terpasang tetapi tidak digunakan; `src/app/api/auth/[...all]/route.ts` hanya handler custom/echo. Scrypt custom dan tabel yang “kompatibel” bukan integrasi Better Auth.

1. Implementasikan Better Auth secara nyata sesuai ADR dan API package yang benar-benar terpasang, termasuk handler Next.js resmi dan adapter PostgreSQL/Drizzle yang sesuai. Jangan membuat facade palsu.
2. Jika integrasi tersebut ternyata tidak compatible dan membutuhkan perubahan model identitas/ADR, **STOP** dengan bukti, opsi, serta rekomendasi. Jangan diam-diam kembali ke custom auth.
3. Browser memakai session cookie `HttpOnly`, `Secure` di production, dan kebijakan `SameSite` yang disetujui. Hapus raw session token dari response register/login/session dan hentikan Bearer token browser kecuali ada kontrak API terpisah yang telah disetujui.
4. Terapkan server-side idle expiry 15 menit untuk shared device, absolute expiry yang terdokumentasi, safe touch/rotation, revoke/logout, serta cleanup session kedaluwarsa. Gunakan injectable clock pada test.
5. Semua endpoint cookie-auth yang mengubah state wajib punya proteksi Origin/Host/CSRF yang diuji. Konfigurasi trusted origin/proxy harus eksplisit; jangan mempercayai `x-forwarded-for` mentah.
6. Rate limit login/register/reset/cohort join/export/delete/sync harus bounded dan tahan restart atau memakai PostgreSQL. Kunci minimal berdasarkan account/player code serta network fingerprint yang dipseudonimkan; tetapkan retention. Jangan gunakan `Map` tak terbatas.
7. Tambahkan security headers server yang relevan dan `Cache-Control: private, no-store` untuk auth, consent, export, reset, serta response privat.

### C. Canonical game transition engine

Hilangkan perbedaan antara schema/validator content dan runtime. Buat satu pure transition/evaluation layer yang dipakai atau diuji bersama oleh validator dan runtime.

1. Implementasikan seluruh operasi canonical secara exhaustive dan fail-closed, termasuk `inflow`, `transfers`, `expense`, `income`, `allocation`, `debtIncurred`, dan `debtRepaid` sesuai schema aktual.
2. Implementasikan seluruh condition canonical, termasuk cash, goal savings, emergency fund, dan debt minimum/maximum. Unknown operation/condition/rubric harus error, bukan diabaikan atau auto-pass.
3. Jangan menebak sumber akun expense. Jika konten canonical ambigu dan perubahan akan mengubah matematika cerita, **STOP** dengan decision ID dan contoh rekonsiliasi.
4. Ganti heuristic Boss “minimal tiga key” dan substring jawaban dengan evaluasi rule machine-readable. Validasi field artifact berdasarkan ID/type/range/rule dan transfer question terhadap answer/rubric canonical. Jika rubrik belum cukup untuk evaluasi deterministik, STOP; jangan mengarang aturan.
5. Reward membaca policy content release yang dipin, bukan angka hardcoded.

### D. Persistensi attempt dan state machine server-authoritative

1. Persist atau rekonstruksi deterministik canonical state per attempt: release ID, revision, current/eligible node, akun/saldo, lifecycle, accepted consequences, dan completion state.
2. Load dan lock attempt (`FOR UPDATE` atau mekanisme PostgreSQL ekuivalen) di dalam satu transaksi sebelum validasi dan mutation. Jangan memakai satu variabel saldo lintas attempt dalam batch.
3. Enforce prerequisite chapter, expected current node, allowed action type, mini-game eligibility/pass, Boss eligibility, mastery, dan status attempt. Tolak skip, out-of-order, premature Boss, Chapter 2 sebelum Chapter 1, dan mutation setelah completion.
4. `START` dengan ID dari client tidak boleh menulis ke attempt milik user lain. Pilih server-generated ID atau namespace/validasi ownership plus immutable attributes sebelum membuat receipt/action.
5. `COMPLETE_MICROLEARNING` hanya sah untuk node canonical pada release pinned, memiliki microlearning, reachable/eligible, dan belum diberi reward. Jangan menerima source ID bebas dari client.
6. Pisahkan immutable action log, story-decision slot, serta retry submission mini-game/Boss. Fail pertama tidak boleh menghalangi instant retry yang disetujui, dan reward pass/completion hanya sekali.

### E. Idempotency, concurrency, installation, dan sync protocol

1. `installationId`, `protocolVersion`, `contentVersion`, `clientSequence`, `batchId`, dan cursor menjadi mandatory serta tervalidasi ketat.
2. Ikat installation kepada account/session. Account A tidak dapat mengirim queue/sequence/attempt milik account B.
3. Tambahkan durable action receipt dengan unique constraint database, minimal mencakup user/account, action ID, installation, sequence, canonical request hash/version, immutable canonical result, attempt revision, dan durable cursor.
4. Replay action identik harus mengembalikan hasil canonical pertama secara deep-equal. ID sama dengan perbedaan satu field menghasilkan conflict stabil seperti `IDEMPOTENCY_KEY_REUSED`.
5. Hilangkan race check-then-insert. Identical concurrent request menghasilkan tepat satu effect dan sisanya duplicate sukses; dua pilihan berbeda pada slot story yang sama menghasilkan satu winner dan conflict deterministik tanpa 500.
6. Cursor tidak boleh `Date.now()`. Gunakan revision/sequence database yang durable. Batch receipt/checkpoint harus mendukung lost response setelah commit.
7. Enforce monotonic sequence dan unique account/installation/sequence. Tolak protocol atau content version unsupported.
8. Validasi `clientOccurredAt` sebagai metadata tidak tepercaya: format, batas masa depan/lampau, dan jangan gunakan untuk otorisasi/reward.
9. Streak hanya berubah setelah qualifying accepted gameplay committed, maksimal satu daily activity per tanggal bisnis Asia/Jakarta. Empty atau fully rejected batch tidak boleh menaikkan streak.
10. Reward response hanya menyatakan “awarded” jika insert ledger benar-benar terjadi (`RETURNING` atau equivalent). Duplicate mengembalikan reward canonical lama, bukan hadiah baru.
11. Ledger/projection harus dapat membangun ulang semua dimension yang diklaim: XP, coin, badge/achievement, artifact, unlock, dan provenance release/action/attempt. Rebuild wajib dibandingkan dengan projection tersimpan.

### F. Content lifecycle dan integrity

1. Hapus hardcode `pilot-v1-draft` dari loader, sync, reward, dan content API.
2. Attempt baru memakai release yang benar-benar published/active; attempt lama selalu pinned ke release awalnya.
3. Satukan lifecycle authoring/DB/API dengan state dan transisi eksplisit. Release `proposed` tidak boleh otomatis menjadi `active` atau disajikan sebagai published.
4. Manifest published berisi SHA-256 tiap artifact/bundle. Seed/publish membandingkan expected digest dengan bytes aktual. Same release ID dengan bytes berbeda harus hard fail; jangan `ON CONFLICT DO NOTHING`.
5. Exactly one active release dijamin database secara concurrency-safe. Published release immutable; perubahan selalu release ID/version baru.
6. Loader/API harus resolve release dari canonical catalog/active pointer dan memverifikasi digest, bukan selalu membaca draft filesystem.
7. Hanya published immutable artifact boleh memakai cache satu tahun/`immutable`. Draft/proposed memakai `no-store` atau tidak tersedia dari public player API.

### G. Authorization, consent, privacy, dan teacher operation

1. Terapkan consent/assent per purpose pada operasi yang benar-benar membutuhkan: analytics, leaderboard, dan pemrosesan opsional lain. Revoke harus efektif server-side.
2. Leaderboard opt-in dan hanya menampilkan display alias aman. Jangan pernah mengirim Player Code/login identifier ke anggota cohort lain.
3. Sediakan teacher provisioning/login yang benar-benar dapat dijalankan untuk pilot melalui jalur admin/CLI aman; jangan membuka public teacher registration dan jangan memakai default credential.
4. Teacher reset harus memverifikasi ownership cohort dan target role, memakai CSPRNG, credential sementara ber-expiry/must-rotate, revoke session lama, recent re-auth, audit record, rate limit, dan response `no-store`. Jangan memakai `Math.random`.
5. Cohort invitation/code harus memiliki expiry/use policy, rate limit, dan penyimpanan aman. Invalid code tidak boleh diabaikan diam-diam; join hanya untuk role yang sesuai.
6. Summary menghitung student distinct dan attempt yang eligible; jangan menggandakan student karena join attempt.
7. Export membutuhkan recent re-auth, rate limit, audit, no-store, dan mencakup semua data subjek yang disimpan sesuai policy.
8. Delete account memakai recent re-auth + CSRF, status/grace period 7 hari, opsi cancel, revoke session, penghentian akses, removal membership yang benar, purge terjadwal/auditable, serta test clock-deterministic. Jangan mengatakan “scheduled” jika job/purge tidak ada.
9. Inventarisasikan IP, user-agent, analytics payload, Player Code, membership, dan semua identifier yang benar-benar disimpan. Minimalkan/hash/truncate sesuai tujuan, tetapkan retention/purge, serta konsistenkan arti `is_anonymous` versus pseudonymous.
10. Analytics menerima allowlisted event/schema kecil, strict size limit, consent yang sesuai, timestamp/install ownership, rate limit, dan tidak menyimpan payload arbitrary/PII.
11. Ubah klaim “zero PII”, “anonymous”, atau “patuh hukum” yang tidak terbukti menjadi deskripsi safeguards teknis/non-legal yang akurat.

### H. API boundary, OpenAPI, dan endpoint stub

1. Semua JSON boundary memakai schema strict: discriminated action types, UUID, integer/range, date, enum, unknown-field rejection, serta error stabil.
2. Batasi `Content-Length` dan bytes yang benar-benar dibaca; sync maksimal 50 action **dan** maksimal 100 KiB. Gunakan `400/413/422` secara konsisten, bukan 500.
3. Rekonsiliasi `docs/architecture/openapi.v1.json` dengan Route Handler aktual. Buat drift matrix dahulu; ikuti keputusan/kontrak approved. Jika perlu breaking choice yang belum diputuskan, STOP dengan opsi. Tambahkan automated contract test untuk path, method, auth, request/response, dan standard error envelope.
4. Endpoint push subscription tidak boleh sekadar echo sukses. Persist subscription/keys secara minimal dan aman untuk VAPID self-hosted, atau kembalikan explicit `501/FEATURE_DISABLED` dan perbaiki kontrak/status. Jangan klaim push terdaftar bila tidak disimpan.
5. Logger harus meredaksi secret/DSN/token meskipun tertanam dalam string atau memakai variasi key. Error publik tidak boleh membuka stack/query/internal detail.

### I. Constraint dan model database

Tambahkan constraint/index/schema yang diperlukan melalui migration additive, antara lain:

- enum/check untuk role, status, lifecycle, action/reward type;
- score/range dan non-negative money yang sesuai domain;
- unique idempotency receipt dan account-installation-sequence;
- attempt canonical revision/current state/release pin;
- pemisahan story decision dari retryable submission;
- daily activity/streak source dengan unique business date;
- canonical badge/achievement/unlock/artifact serta coin projection;
- content artifact digest dan exactly-one active release;
- reset audit, deletion schedule, rate-limit/abuse record, dan push subscription bila fitur enabled.

Jangan menambahkan tabel hanya untuk membuat checklist hijau: setiap data harus dipakai, diuji, punya retention/ownership, dan masuk export/delete bila relevan.

## 5. Tes penerimaan wajib

Gunakan PostgreSQL disposable nyata. Tambahkan unit, integration, contract, dan production-like HTTP tests yang benar-benar memukul `next start`; Route Handler direct-call boleh tetap ada tetapi tidak boleh disebut E2E.

Minimal semua skenario berikut harus terbukti:

1. Satu chapter dikirim per scene dalam request terpisah, process restart di tengah, lalu hasil sama dengan satu batch.
2. Dua attempt dalam satu batch tidak mencampur saldo/state.
3. Seluruh jalur Chapter 2 yang dihasilkan validator memberi hasil runtime yang sama, termasuk inflow, transfers, emergency fund, dan debt.
4. Scene skip/out-of-order, Chapter 2 early start, premature mini-game/Boss, direct completion, dan mutation setelah complete ditolak.
5. Fake microlearning ID tidak memberi XP.
6. Artifact tiga field dan arbitrary transfer gagal; artifact/transfer canonical valid lulus sesuai rubric.
7. Mini-game/Boss fail lalu instant retry berhasil; reward, badge, unlock, dan completion tetap tepat sekali.
8. Replay identik deep-equal dengan result pertama; payload berbeda pada action ID sama mendapat deterministic conflict.
9. 20 concurrent duplicate dan forced two-choice race: satu effect, sisanya duplicate/conflict, tanpa 500 atau rejected promise.
10. Lost response after commit lalu retry mengembalikan receipt/result yang sama.
11. Account/installation A tidak dapat start, membaca, atau mengirim sequence/outbox untuk B.
12. Missing/invalid installation, duplicate/non-monotonic sequence, unsupported protocol/content version, malformed/future timestamp, >50 action, >100 KiB, dan unknown field ditolak tepat.
13. Attempt lama tetap memakai release lama setelah active release berubah.
14. Proposed content tidak tersedia sebagai published; digest cocok dengan bytes served; same ID/different bytes hard fail; concurrent activation menyisakan tepat satu active release.
15. Empty/rejected sync tidak mengubah streak; accepted activity hari yang sama hanya dihitung sekali.
16. Projection rebuild sama persis dengan ledger untuk XP, coin, badge, achievement, artifact, dan unlock.
17. Raw session token tidak ada di JSON/log/storage client; bad Origin/CSRF, expired/idle session, revoked session, dan oversized auth payload ditolak.
18. Player tidak dapat melihat Player Code pemain lain; leaderboard tanpa opt-in ditolak/diabaikan sesuai kontrak.
19. Teacher lintas cohort ditolak; reset temporary credential expiry/must-rotate/revoke/audit terbukti.
20. Consent revoke benar-benar memblokir pemrosesan opsional; export lengkap; delete grace/cancel/purge/membership cleanup terbukti.
21. OpenAPI contract test cocok dengan seluruh Route Handler yang diklaim.
22. Fresh DB migrate+seed dua kali, upgrade dari `0000`, readiness schema mismatch, dan rollback rehearsal terverifikasi.
23. Test database guard sengaja diuji terhadap URL non-`_test` dan harus menolak sebelum mutation.

Tes harus deterministic dengan injected clock/UUID/random bila relevan. Bersihkan fixture sesudah suite; jangan bergantung pada database developer yang sudah berisi data.

## 6. Urutan kerja agar risiko terkendali

Kerjakan dan gate secara berurutan:

1. P0 safety: credential/config/test DB guard.
2. Migration additive + canonical receipt/state model.
3. Canonical engine dan state machine.
4. Transactional sync/idempotency/concurrency.
5. Real Better Auth/session/CSRF/rate limit.
6. Content publish/integrity.
7. Consent/teacher/privacy/API boundary/OpenAPI.
8. Full regression dan production-like HTTP test.
9. Dokumentasi/status/handoff yang jujur.

Jika satu langkah membutuhkan keputusan produk yang belum approved, STOP hanya pada bagian itu, lanjutkan pemeriksaan read-only yang aman, dan jangan menyamarkan blocker.

## 7. Verifikasi akhir

Jalankan dan laporkan exact command + exit code, minimal:

```text
npm.cmd run content:validate
npm.cmd run content:validate
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Tambahkan command terpisah untuk:

- fresh disposable DB migrate + seed/publish + second run;
- migration upgrade dari `0000`;
- integration/concurrency/security/contract suite;
- `next start` + real HTTP smoke/journey;
- content digest tamper test;
- ledger/projection reconciliation;
- secret/credential scan yang tidak mencetak nilai;
- `git diff --check`, `git status --short`, dan `git diff --stat`.

`npm audit` boleh dijalankan, tetapi triage exploitability wajib dan jangan melakukan blind major upgrade.

## 8. Artefak dan handoff

Buat/update seperlunya:

- migration additive dan schema;
- source/test backend yang relevan;
- OpenAPI/ADR/threat model/traceability hanya agar sesuai keputusan nyata, bukan mengubah sejarah;
- `docs/implementation/PHASE-07R-STATUS.md` berstatus `PROPOSED`;
- laporan defect-to-fix matrix: ID, severity, root cause, file, regression test, fix, evidence, residual risk.

Respons akhir wajib memakai heading `PHASE 07R BACKEND REMEDIATION`, lalu template `docs/antigravity/HANDOFF_TEMPLATE.md`. Sertakan:

- commit awal dan worktree state;
- daftar migration/data change dan rollback;
- semua env var baru hanya namanya;
- dependency baru, lisensi, alasan, dan bukti tetap gratis/self-hosted;
- exact test command/exit code;
- temuan yang masih `FAIL/BLOCKED`;
- bukti tidak ada UI/Figma/WebM/client-offline/VPS change;
- verdict yang diminta hanya `REVIEW REQUIRED`/`REVISE`, tidak pernah `APPROVED`.

Fase 06 client offline tetap harus dijalankan dan direview setelah backend candidate ini stabil. Fase 08/VPS dan Fase 09/final audit tidak boleh dianggap lulus oleh corrective pass ini.

