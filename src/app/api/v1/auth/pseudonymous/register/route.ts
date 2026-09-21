import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { generateRandomPlayerCode, playerCodeToTechnicalEmail } from '@/lib/auth/player-code';
import { hashPassphrase, validatePassphrasePolicy } from '@/lib/auth/passphrase';
import { createSession, getSessionCookieHeader } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { BadRequestError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`register_${ip}`, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        formatErrorEnvelope(new BadRequestError('Terlalu banyak percobaan pendaftaran. Coba lagi nanti.')).envelope,
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const nickname = (body.nickname || 'Petualang').trim().slice(0, 32);
    const passphrase = body.passphrase;
    const cohortCode = body.cohortCode ? String(body.cohortCode).trim().toUpperCase() : null;

    const policy = validatePassphrasePolicy(passphrase);
    if (!policy.valid) {
      throw new BadRequestError(policy.reason || 'Kata sandi tidak valid.');
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate unique player code (retry up to 5 times in case of collision)
      let playerCode = '';
      let isUnique = false;
      for (let i = 0; i < 5; i++) {
        const candidate = generateRandomPlayerCode();
        const checkRes = await client.query('SELECT id FROM users WHERE player_code = $1;', [candidate]);
        if (checkRes.rowCount === 0) {
          playerCode = candidate;
          isUnique = true;
          break;
        }
      }

      if (!isUnique) {
        throw new Error('Gagal menghasilkan Player Code unik. Silakan coba kembali.');
      }

      const technicalEmail = playerCodeToTechnicalEmail(playerCode);
      const passwordHash = await hashPassphrase(passphrase);

      // Insert User
      const userRes = await client.query(
        `INSERT INTO users (role, player_code, nickname, is_anonymous, created_at, updated_at)
         VALUES ('student', $1, $2, false, NOW(), NOW())
         RETURNING id, role, player_code, nickname;`,
        [playerCode, nickname]
      );
      const user = userRes.rows[0];

      // Insert Account (Better Auth credential compatible)
      await client.query(
        `INSERT INTO accounts (user_id, account_id, provider_id, password_hash, created_at, updated_at)
         VALUES ($1, $2, 'credential', $3, NOW(), NOW());`,
        [user.id, technicalEmail, passwordHash]
      );

      // If cohortCode is provided, enroll student
      if (cohortCode) {
        const cohortRes = await client.query(
          `SELECT id FROM cohorts WHERE cohort_code = $1 AND is_active = true;`,
          [cohortCode]
        );
        if (cohortRes.rowCount && cohortRes.rowCount > 0) {
          const cohortId = cohortRes.rows[0].id;
          await client.query(
            `INSERT INTO cohort_members (cohort_id, user_id, joined_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (cohort_id, user_id) DO NOTHING;`,
            [cohortId, user.id]
          );
        }
      }

      // Initialize default projection and streak
      await client.query(
        `INSERT INTO player_projections (user_id, total_xp, total_stars, completed_chapters, updated_at)
         VALUES ($1, 0, 0, '[]'::jsonb, NOW())
         ON CONFLICT (user_id) DO NOTHING;`,
        [user.id]
      );

      await client.query(
        `INSERT INTO player_streaks (user_id, current_streak, longest_streak, updated_at)
         VALUES ($1, 0, 0, NOW())
         ON CONFLICT (user_id) DO NOTHING;`,
        [user.id]
      );

      await client.query('COMMIT');

      // Create session
      const userAgent = req.headers.get('user-agent') || undefined;
      const { token, expiresAt } = await createSession(user.id, ip, userAgent);

      const cookieHeader = getSessionCookieHeader(token, expiresAt);

      return NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            role: user.role,
            playerCode: user.player_code,
            nickname: user.nickname,
          },
          sessionToken: token,
          expiresAt: expiresAt.toISOString(),
          serverTime: defaultClock.nowIso(),
        },
        {
          status: 201,
          headers: {
            'Set-Cookie': cookieHeader,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
