# Prompt Fase 06 — Offline-First PWA dan Sync Client

Jalankan hanya setelah Fase 05 disetujui.

---

Kamu bekerja di repository `finspire`. Implementasikan technical PWA shell, IndexedDB local store, durable outbox, service worker, dan reconciliation client agar Chapter pilot yang sudah diunduh benar-benar dapat dimainkan offline. UI visual/final tetap di luar scope.

## Preflight wajib

1. Baca kontrak bersama, seluruh arsitektur/ADR terutama offline sync dan content release, OpenAPI/schema, serta hasil Fase 01–05.
2. Pastikan semua status sebelumnya `APPROVED`, server action processor/idempotency telah lulus concurrency test, dan `/api/v1/sync` contract tidak ambiguous.
3. Baca `AGENTS.md` dan dokumentasi Next.js 16 lokal tentang PWA/service worker/Route Handlers/build. Verifikasi kompatibilitas Serwist atau library IndexedDB pada dokumentasi resmi sebelum menambah dependency.
4. Jalankan baseline validator/tests/build dan `git status --short`.

STOP jika server sync belum siap, content pack belum versioned, atau pilihan service worker tidak kompatibel dengan build aktual.

## Outcome wajib

Setelah satu login/bootstrap dan download pack saat online, pemain yang sama dapat:

1. membuka ulang aplikasi tanpa jaringan;
2. melanjutkan attempt yang tersimpan;
3. membuat action secara lokal dan melihat state provisional yang jujur;
4. menutup/reload browser tanpa kehilangan action;
5. kembali online dan mendapat canonical result tepat satu kali;
6. menangani conflict/rejection/auth expiry tanpa mencampur akun.

## A. PWA foundation

- Tambahkan web app manifest valid, metadata install, offline navigation fallback, dan icon teknis minimum. Tandai asset placeholder agar mudah diganti; jangan mendesain brand final.
- Implementasikan service worker yang terbukti bekerja pada **production build**, bukan hanya dev.
- Serwist boleh dipakai hanya bila kompatibel dengan Next.js aktual dan build/test membuktikannya; fallback ke service worker Web API sesuai docs bila tidak.
- Jangan memakai `skipWaiting`/`clientsClaim` secara agresif bila dapat memotong transaksi/outbox. Sediakan lifecycle update yang aman.
- Sinkronisasi dipicu pada app start, `online`, focus/visibility, manual retry, dan Background Sync bila tersedia. Background Sync hanya enhancement.
- Registrasi service worker, sync coordinator, dan browser-only code harus terisolasi dari SSR/server bundle.

## B. Cache policy

Implementasikan cache bernama/versioned dan terdokumentasi:

- precache: shell publik netral dan offline fallback minimum;
- cache-first/immutable: build-hashed static assets;
- stale-while-revalidate atau network-first sesuai ADR untuk manifest publik;
- cache-first setelah validasi untuk immutable content pack;
- runtime cache terpisah untuk asset maskot/content;
- network-only: auth, bootstrap privat, progress, sync, export/delete, teacher, analytics mutation, dan semua non-GET.

Dilarang wildcard-cache seluruh `/api`. Pastikan response authenticated/private tidak masuk Cache Storage. Cleanup hanya cache prefix milik Finspire dan tidak menghapus pack yang masih direferensikan attempt/outbox.

## C. IndexedDB versioned store

Gunakan library open-source yang disetujui ADR atau wrapper kecil teruji. Schema minimal:

- installation metadata dan monotonic sequence;
- immutable content manifests/packs + checksum/status;
- active pack pointer;
- account-scoped canonical/provisional projection;
- playthrough/attempt state;
- durable outbox action;
- sync receipt/cursor;
- schema/app/content compatibility metadata.

Setiap perubahan offline harus atomik: buat `actionId` sekali, tulis immutable outbox action, lalu update provisional projection dalam transaksi IndexedDB yang sama. Simpan raw intent, dependency, installation ID, sequence, attempt, content version, expected revision, created time, attempts, dan state—bukan client-calculated reward sebagai fakta canonical.

Implementasikan migration IDB, open failure, blocked upgrade, corruption recovery yang tidak menghapus queue diam-diam, `QuotaExceededError`, eviction/persistence detection, dan safe cleanup. Jangan menyimpan passphrase, cookie, bearer/session token, recovery code, atau secret.

## D. Account namespace dan auth expiry

- Namespace local private data dengan immutable server player/account scope ditambah installation ID; jangan memakai display alias sebagai key.
- `401` mengubah queue menjadi `needs-auth`, menghentikan aggressive retry, dan tidak menghapus outbox.
- Re-login akun yang sama melanjutkan sync. Akun berbeda tidak dapat melihat/mengirim/mengadopsi queue lama.
- Explicit logout memerlukan policy caller: sync dulu atau konfirmasi discard bila pending; setelah logout bersihkan snapshot privat agar aman di perangkat sekolah bersama.
- Gunakan single-flight lintas tab dengan Web Locks/BroadcastChannel dan fallback lease IDB yang memiliki expiry. Crash tidak boleh meninggalkan lock permanen.

## E. Content pack dan asset

- Download ke staging store, validasi JSON schema/version/SHA-256, lalu ganti active pointer secara atomik. Pack lama tetap aktif bila download/validasi gagal.
- Attempt yang berjalan pinned ke content version awal. Jangan apply consequence dari version terbaru ke action lama.
- Pertahankan pack yang direferensikan attempt/outbox; cleanup berdasarkan reference dan budget.
- Tangani revoked/unsupported version dengan status recovery terstruktur, bukan silently upgrade.
- Siapkan asset manifest logical key untuk WebM transparan dan fallback PNG/WebP/reduced-motion. Jangan membuat asset final.
- Jangan precache seluruh video besar saat install. Unduh per pack/state. Jika mendukung playback offline WebM, uji Range response atau strategi blob/cache yang benar dengan fixture kecil; kegagalan video tidak boleh memblokir gameplay.

## F. Sync coordinator

Integrasikan persis `/api/v1/sync`/contract approved:

- batch bounded dan ordered berdasarkan dependency/sequence;
- satu sync aktif per account/installation;
- exponential backoff + jitter untuk retryable error;
- `accepted`/`duplicate` menerapkan receipt + canonical snapshot kemudian ack outbox secara atomik;
- `conflict` menyimpan canonical state dan menandai aksi untuk resolusi yang dapat ditampilkan UI kelak;
- permanent rejection masuk dead-letter dengan reason, tidak retry loop;
- network timeout setelah server commit tetap aman karena action ID tidak berubah;
- out-of-order, stale revision, unsupported content, partial batch, malformed response, dan server cursor reset ditangani eksplisit;
- analytics/push failure tidak boleh menghambat gameplay sync.

Jangan mengklaim exactly-once network delivery. Buktikan effectively-once effect melalui receipt, constraint, transaction, dan replay.

## G. State/API untuk UI mendatang

Expose typed, framework-light interfaces/hooks untuk:

- connectivity dan capability;
- pack download/availability;
- `offline|idle|pending|syncing|synced|needs-auth|conflict|retryable-error|permanent-error`;
- pending count/last sync/retry;
- canonical vs provisional marker;
- storage/quota/update warning.

Zustand bila dipakai hanya menjadi view adapter; IndexedDB/outbox/server tetap source of truth. Buat technical debug harness hanya di development/test dan pastikan tidak membuka data sensitif atau menjadi UI final.

## H. Test wajib

Gunakan unit + PostgreSQL integration + browser E2E pada production build. Minimal:

- IDB create/upgrade/migration/blocked/quota;
- atomic enqueue + provisional update;
- hard reload offline setelah bootstrap;
- attempt/action bertahan setelah reload, tab tutup, browser context dibuka lagi;
- reconnect/flush dan partial acknowledgement;
- putus jaringan setelah server commit sebelum response, lalu replay;
- 20 duplicate action menghasilkan satu canonical effect;
- dua tab single-flight dan crash lease recovery;
- dua browser/device memilih choice berbeda: first server commit wins;
- auth expire, re-login akun sama, lalu akun berbeda;
- logout dengan queue pending;
- content update saat attempt aktif, checksum corrupt, revoked version;
- service worker update saat outbox pending;
- offline asset WebM fixture/Range atau fallback static;
- Cache Storage tidak memiliki response privat;
- online path dan offline-sync path menghasilkan canonical projection/ledger sama.

Jangan menyebut mock request sebagai browser offline E2E. Jika browser binary/HTTPS production-like environment tidak tersedia, status gate E2E `BLOCKED`.

## Dokumentasi/output

Dokumentasikan IDB schema/migration, cache matrix, service-worker lifecycle, sync state machine, conflict matrix, account cleanup, browser capability/fallback, storage recovery, dan manual device test. Buat `docs/implementation/PHASE-06-STATUS.md` berstatus `PROPOSED`.

## Acceptance gate

Semua validator/lint/typecheck/unit/integration/contract/browser E2E/build harus lulus. Wajib ada bukti hard-reload offline, persistence setelah close, lost-response retry tanpa duplicate reward, multi-device conflict, expired-session quarantine, account isolation, pinned content, service worker update safety, WebM fallback, dan no-private-cache. Jalankan `git diff --check`, secret/PII scan, status, dan diff stat.

## Handoff

Ikuti `docs/antigravity/HANDOFF_TEMPLATE.md`. Tambahkan browser matrix, cache table, IDB version, state diagram, exact E2E scenarios, dan limitation yang benar-benar teramati. Jangan lanjut ke Fase 07.

---

