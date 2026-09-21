import { NextRequest, NextResponse } from 'next/server';
import { normalizePlayerCode } from '@/lib/auth/player-code';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limiter';
import { BadRequestError, formatErrorEnvelope } from '@/lib/errors';
import { getAuth } from '@/lib/auth/auth';
import { getDb } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

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
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);

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

    const auth = getAuth();

    // Call Better Auth sign-in
    const authResponse = (await auth.api.signInUsername({
      body: {
        username: playerCode,
        password: passphrase,
      },
      asResponse: true,
      headers: req.headers,
    })) as Response;

    if (!authResponse.ok) {
       // Dummy response body is returned by better auth for errors
       const errBody = await authResponse.json().catch(() => null);
       return NextResponse.json(
         formatErrorEnvelope(new BadRequestError('Player Code atau kata sandi tidak valid.')).envelope,
         { status: 401 }
       );
    }

    // Reset rate limit on successful login
    await resetRateLimit(rateLimitKey);

    const authData = await authResponse.json();

    // Fetch the enriched user to return
    const db = getDb();
    const dbUser = await db.query.users.findFirst({
       where: eq(users.id, authData.user.id),
    });

    const headers = new Headers(authResponse.headers);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: dbUser?.id || authData.user.id,
          role: dbUser?.role || 'student',
          playerCode: dbUser?.playerCode || playerCode,
          nickname: dbUser?.nickname || authData.user.name,
        },
        serverTime: new Date().toISOString(),
      },
      {
        status: 200,
        headers: headers,
      }
    );
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
