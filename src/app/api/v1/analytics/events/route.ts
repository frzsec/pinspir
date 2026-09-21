import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema/analytics';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { formatErrorEnvelope, BadRequestError } from '@/lib/errors';
import { redactSensitiveData } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ALLOWLISTED_EVENTS = new Set([
  'chapter_start',
  'chapter_complete',
  'minigame_start',
  'minigame_complete',
  'sync_completed',
  'app_installed',
  'offline_enter',
  'offline_exit',
]);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json();

    if (!body || !Array.isArray(body.events)) {
      throw new BadRequestError('Payload events harus berupa array objek acara.');
    }

    if (body.events.length > 20) {
      throw new BadRequestError('Maksimal 20 acara analitik per permintaan.');
    }

    const validInserts: (typeof analyticsEvents.$inferInsert)[] = [];
    for (const ev of body.events) {
      if (!ev.eventName || !ALLOWLISTED_EVENTS.has(ev.eventName)) {
        continue; // skip non-allowlisted events silently
      }

      const sanitizedPayload = (redactSensitiveData(ev.eventPayload || {}) as Record<string, unknown>) || {};
      validInserts.push({
        eventName: ev.eventName,
        userId: user?.id ?? null,
        installationId: ev.installationId ?? null,
        eventPayload: sanitizedPayload,
        occurredAt: ev.clientOccurredAt ? new Date(ev.clientOccurredAt) : new Date(),
      });
    }

    if (validInserts.length > 0) {
      await db.insert(analyticsEvents).values(validInserts);
    }

    return NextResponse.json(
      {
        success: true,
        recordedCount: validInserts.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
        },
      }
    );
  } catch (err) {
    const { status, body } = formatErrorEnvelope(err);
    return NextResponse.json(body, { status });
  }
}
