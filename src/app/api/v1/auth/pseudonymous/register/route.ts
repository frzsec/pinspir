import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { generateRandomPlayerCode } from '@/lib/auth/player-code';
import { validatePassphrasePolicy } from '@/lib/auth/passphrase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { BadRequestError, formatErrorEnvelope } from '@/lib/errors';
import { getAuth } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(`register_${ip}`, 10, 10 * 60 * 1000);
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
    let playerCode = '';

    try {
      await client.query('BEGIN');

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

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const auth = getAuth();
    
    const authResponse = (await auth.api.signUpEmail({
      body: {
        email: `${playerCode.toLowerCase()}@finspire.invalid`,
        password: passphrase,
        name: nickname,
        username: playerCode,
      },
      asResponse: true,
    })) as Response;

    if (!authResponse.ok) {
      // Forward the error from Better Auth
      const errBody = await authResponse.json();
      return NextResponse.json(errBody, { status: authResponse.status });
    }

    // Now enrich the DB using the user ID from the response (we have to fetch the user by username to get ID)
    const enrichClient = await pool.connect();
    try {
      await enrichClient.query('BEGIN');
      
      const userRes = await enrichClient.query('SELECT id FROM users WHERE username = $1;', [playerCode]);
      if (userRes.rowCount === 0) {
         throw new Error('User creation failed to propagate.');
      }
      const userId = userRes.rows[0].id;

      await enrichClient.query(
        `UPDATE users SET player_code = $1, nickname = $2 WHERE id = $3;`,
        [playerCode, nickname, userId]
      );

      if (cohortCode) {
        const cohortRes = await enrichClient.query(
          `SELECT id FROM cohorts WHERE cohort_code = $1 AND is_active = true;`,
          [cohortCode]
        );
        if (cohortRes.rowCount && cohortRes.rowCount > 0) {
          const cohortId = cohortRes.rows[0].id;
          await enrichClient.query(
            `INSERT INTO cohort_members (cohort_id, user_id, joined_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (cohort_id, user_id) DO NOTHING;`,
            [cohortId, userId]
          );
        }
      }

      await enrichClient.query(
        `INSERT INTO player_projections (user_id, total_xp, total_stars, completed_chapters, updated_at)
         VALUES ($1, 0, 0, '[]'::jsonb, NOW())
         ON CONFLICT (user_id) DO NOTHING;`,
        [userId]
      );

      await enrichClient.query(
        `INSERT INTO player_streaks (user_id, current_streak, longest_streak, updated_at)
         VALUES ($1, 0, 0, NOW())
         ON CONFLICT (user_id) DO NOTHING;`,
        [userId]
      );

      await enrichClient.query('COMMIT');
    } catch (err) {
      await enrichClient.query('ROLLBACK');
      throw err;
    } finally {
      enrichClient.release();
    }
    
    // Convert Web Response to NextResponse to allow Next.js routing logic
    const headers = new Headers(authResponse.headers);
    
    // The response body from Better Auth is just `{ user, session, token }`
    const authData = await authResponse.json();

    return NextResponse.json(
      {
        success: true,
        user: {
          ...authData.user,
          playerCode,
          nickname,
          role: 'student'
        },
        serverTime: new Date().toISOString()
      },
      {
        status: 201,
        headers: headers,
      }
    );
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
