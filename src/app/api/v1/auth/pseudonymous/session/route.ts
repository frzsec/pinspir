import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError('Sesi tidak ditemukan atau telah berakhir.');
    }

    return NextResponse.json(
      {
        success: true,
        user: session.user,
        // D-20: sessionToken intentionally omitted from JSON.
        // The session token travels only in the HttpOnly cookie.
        expiresAt: session.expiresAt.toISOString(),
        serverTime: defaultClock.nowIso(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
