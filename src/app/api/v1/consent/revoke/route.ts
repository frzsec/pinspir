import { NextRequest, NextResponse } from 'next/server';
import { getPool, db } from '@/db';
import { analyticsEvents } from '@/db/schema/analytics';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { BadRequestError, UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const body = await req.json().catch(() => ({}));
    const consentType = body.consentType;

    if (!consentType) {
      throw new BadRequestError('consentType wajib disertakan.');
    }

    const pool = getPool();
    await pool.query(
      `UPDATE user_consents
       SET granted = false, revoked_at = NOW()
       WHERE user_id = $1 AND consent_type = $2;`,
      [session.user.id, consentType]
    );

    // Record mandatory telemetry
    await db.insert(analyticsEvents).values({
      eventName: 'consent_revoked',
      userId: session.user.id,
      eventPayload: { consentType },
      occurredAt: defaultClock.now(),
    });

    return NextResponse.json({
      success: true,
      consentType,
      granted: false,
      message: `Persetujuan untuk ${consentType} berhasil dicabut.`,
      serverTime: defaultClock.nowIso(),
    });
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
