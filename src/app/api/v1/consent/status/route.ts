import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const pool = getPool();
    const res = await pool.query(
      `SELECT consent_type, granted, granted_at, revoked_at
       FROM user_consents
       WHERE user_id = $1
       ORDER BY granted_at DESC;`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      consents: res.rows.map((r) => ({
        consentType: r.consent_type,
        granted: r.granted,
        grantedAt: r.granted_at ? new Date(r.granted_at).toISOString() : null,
        revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : null,
      })),
      serverTime: defaultClock.nowIso(),
    });
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
