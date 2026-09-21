import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// 1. Env & Redaction Tests
import { redactSensitiveUrl } from '../../src/lib/config/env.ts';

describe('1. Configuration & Redaction', () => {
  test('redactSensitiveUrl successfully redacts password from DSN', () => {
    const rawDsn = 'postgresql://user_admin:superSecretPass123@db.example.com:5432/finspire_prod';
    const redacted = redactSensitiveUrl(rawDsn);
    assert.equal(redacted.includes('superSecretPass123'), false);
    assert.equal(redacted.includes('****'), true);
  });

  test('redactSensitiveUrl handles empty or invalid url safely', () => {
    assert.equal(redactSensitiveUrl(''), '');
    assert.equal(redactSensitiveUrl('not-a-valid-url'), '[REDACTED]');
  });
});

// 2. Clock Provider Tests
import { MockClockProvider, SystemClockProvider } from '../../src/lib/clock/index.ts';

describe('2. Deterministic Clock Provider', () => {
  test('SystemClockProvider formats todayWib as YYYY-MM-DD', () => {
    const clock = new SystemClockProvider();
    const today = clock.todayWib();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  test('MockClockProvider allows deterministic time control and advancing', () => {
    const clock = new MockClockProvider('2026-03-21T07:00:00.000Z');
    assert.equal(clock.nowIso(), '2026-03-21T07:00:00.000Z');
    assert.equal(clock.todayWib(), '2026-03-21');

    clock.advanceHours(24);
    assert.equal(clock.nowIso(), '2026-03-22T07:00:00.000Z');
    assert.equal(clock.todayWib(), '2026-03-22');
  });
});

// 3. UUID Generator Tests
import { DeterministicUuidGenerator, isValidUuid } from '../../src/lib/ids/index.ts';

describe('3. UUID Generator & Validation', () => {
  test('DeterministicUuidGenerator produces reproducible sequence', () => {
    const gen = new DeterministicUuidGenerator();
    const id1 = gen.generate();
    const id2 = gen.generate();

    assert.equal(id1, '00000000-0000-4000-8000-000000000001');
    assert.equal(id2, '00000000-0000-4000-8000-000000000002');
    assert.equal(isValidUuid(id1), true);
    assert.equal(isValidUuid(id2), true);

    gen.reset();
    assert.equal(gen.generate(), '00000000-0000-4000-8000-000000000001');
  });

  test('isValidUuid rejects invalid UUID strings', () => {
    assert.equal(isValidUuid('invalid-uuid-string'), false);
    assert.equal(isValidUuid('12345'), false);
  });
});

// 4. Logger Redaction Tests
import { redactSensitiveData } from '../../src/lib/logger/index.ts';

describe('4. Logger Sensitive Data Redaction', () => {
  test('redactSensitiveData redacts passphrase, token, sessionToken, cookie', () => {
    const payload = {
      username: 'student_123',
      passphrase: 'superSecretPhraseWord',
      token: 'jwt.token.secret',
      sessionToken: 'session_token_xyz',
      cookie: 'connect.sid=12345',
      nested: {
        password: 'nestedSecretPassword',
        publicNote: 'Aman untuk ditampilkan',
      },
    };

    const sanitized = redactSensitiveData(payload);
    assert.equal(sanitized.passphrase, '[REDACTED]');
    assert.equal(sanitized.token, '[REDACTED]');
    assert.equal(sanitized.sessionToken, '[REDACTED]');
    assert.equal(sanitized.cookie, '[REDACTED]');
    assert.equal(sanitized.nested.password, '[REDACTED]');
    assert.equal(sanitized.nested.publicNote, 'Aman untuk ditampilkan');
  });
});

// 5. Error Envelope Formatting Tests
import {
  BadRequestError,
  formatErrorEnvelope,
} from '../../src/lib/errors/index.ts';

describe('5. Error Envelope Formatting', () => {
  test('formatErrorEnvelope formats AppError properly', () => {
    const err = new BadRequestError('Parameter chapterId wajib disertakan.', { field: 'chapterId' });
    const { statusCode, envelope } = formatErrorEnvelope(err, 'req-test-123', '2026-03-21T10:00:00Z');

    assert.equal(statusCode, 400);
    assert.equal(envelope.success, false);
    assert.equal(envelope.error.code, 'BAD_REQUEST');
    assert.equal(envelope.error.message, 'Parameter chapterId wajib disertakan.');
    assert.equal(envelope.error.details.field, 'chapterId');
    assert.equal(envelope.error.requestId, 'req-test-123');
    assert.equal(envelope.error.serverTime, '2026-03-21T10:00:00Z');
  });

  test('formatErrorEnvelope conceals internal error details and stack trace', () => {
    const internalErr = new Error('Database password failed at postgresql://user:pass@secret:5432');
    const { statusCode, envelope } = formatErrorEnvelope(internalErr);

    assert.equal(statusCode, 500);
    assert.equal(envelope.success, false);
    assert.equal(envelope.error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(envelope.error.message, 'Terjadi kesalahan internal pada server.');
    assert.equal(envelope.error.message.includes('password'), false);
    assert.equal(envelope.error.message.includes('secret'), false);
  });
});
