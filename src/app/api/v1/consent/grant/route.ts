import { NextRequest, NextResponse } from 'next/server';
import { getPool, db } from '@/db';
import { analyticsEvents } from '@/db/schema/analytics';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { BadRequestError, UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

const ALLOWED_CONSENTS = new Set([
  'terms_of_service',
  'analytics_minimal',
  'leaderboard_opt_in',
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const body = await req.json().catch(() => ({}));
    const consentType = body.consentType;

    if (!consentType || !ALLOWED_CONSENTS.has(consentType)) {
      throw new BadRequestError(`Jenis persetujuan tidak valid. Pilihan: ${Array.from(ALLOWED_CONSENTS).join(', ')}`);
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO user_consents (user_id, consent_type, granted, granted_at, revoked_at)
       VALUES ($1, $2, true, NOW(), NULL);`,
      [session.user.id, consentType]
    );

    // Record mandatory telemetry
    await db.insert(analyticsEvents).values({
      eventName: 'consent_granted',
      userId: session.user.id,
      eventPayload: { consentType },
      occurredAt: defaultClock.now(),
    });

    return NextResponse.json({
      success: true,
      consentType,
      granted: true,
      message: `Persetujuan untuk ${consentType} berhasil diberikan.`,
      serverTime: defaultClock.nowIso(),
    });
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
