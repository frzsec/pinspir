import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { normalizePlayerCode } from '@/lib/auth/player-code';
import { verifyPassphrase } from '@/lib/auth/passphrase';
import { createSession, getSessionCookieHeader } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limiter';
import { BadRequestError, UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

const DUMMY_HASH = 'scrypt$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json().catch(() => ({}));
    const rawPlayerCode = body.playerCode;
    const passphrase = body.passphrase;

    if (!rawPlayerCode || !passphrase) {
      throw new BadRequestError('Player Code dan kata sandi wajib diisi.');
    }

    const playerCode = normalizePlayerCode(rawPlayerCode);
    const rateLimitKey = `login_${ip}_${playerCode}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        formatErrorEnvelope(
          new BadRequestError('Terlalu banyak percobaan login gagal. Akun dikunci sementara selama 10 menit.', {
            retryAfterSeconds: rateCheck.resetInSeconds,
          })
        ).envelope,
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
          },
        }
      );
    }

    const pool = getPool();
    const userRes = await pool.query(
      `SELECT u.id, u.role, u.player_code, u.nickname, u.deleted_at, a.password_hash
       FROM users u
       LEFT JOIN accounts a ON a.user_id = u.id AND a.provider_id = 'credential'
       WHERE u.player_code = $1 AND u.deleted_at IS NULL;`,
      [playerCode]
    );

    let isValid = false;
    let userRecord = null;

    if (userRes.rowCount && userRes.rowCount > 0 && userRes.rows[0].password_hash) {
      userRecord = userRes.rows[0];
      isValid = await verifyPassphrase(passphrase, userRecord.password_hash);
    } else {
      // Dummy check to protect against timing attacks & user enumeration
      await verifyPassphrase(passphrase, DUMMY_HASH);
    }

    if (!isValid || !userRecord) {
      throw new UnauthorizedError('Player Code atau kata sandi tidak valid.');
    }

    // Reset rate limit on successful login
    resetRateLimit(rateLimitKey);

    const userAgent = req.headers.get('user-agent') || undefined;
    const { token, expiresAt } = await createSession(userRecord.id, ip, userAgent);
    const cookieHeader = getSessionCookieHeader(token, expiresAt);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userRecord.id,
          role: userRecord.role,
          playerCode: userRecord.player_code,
          nickname: userRecord.nickname,
        },
        sessionToken: token,
        expiresAt: expiresAt.toISOString(),
        serverTime: defaultClock.nowIso(),
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookieHeader,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
