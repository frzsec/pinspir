import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { playerProjections, playerStreaks } from '@/db/schema/projections';
import { getActiveReleaseManifest, ensureContentLoaded } from '@/lib/game/content-loader';
import { formatErrorEnvelope, UnauthorizedError } from '@/lib/errors';
import { getSystemClock } from '@/lib/clock';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError('Sesi tidak valid atau telah kedaluwarsa.');
    }

    const clock = getSystemClock();
    await ensureContentLoaded();
    const manifest = getActiveReleaseManifest();

    // Fetch projection & streak
    const [projRows, streakRows] = await Promise.all([
      db.select().from(playerProjections).where(eq(playerProjections.userId, user.id)),
      db.select().from(playerStreaks).where(eq(playerStreaks.userId, user.id)),
    ]);

    const projection = projRows[0] ?? {
      totalXp: 0,
      totalStars: 0,
      completedChapters: [],
    };

    const streak = streakRows[0] ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };

    const identity = projection.completedChapters.includes('chapter-02')
      ? 'Financial Shield Planner'
      : projection.completedChapters.includes('chapter-01')
      ? 'Survivor'
      : 'Novice';

    return NextResponse.json(
      {
        user: {
          id: user.id,
          playerCode: user.playerCode,
          role: user.role,
        },
        activeRelease: {
          releaseId: manifest.releaseId,
          schemaVersion: manifest.schemaVersion,
          title: manifest.title,
          locale: manifest.locale,
        },
        projection: {
          totalXp: projection.totalXp,
          totalStars: projection.totalStars,
          completedChapters: projection.completedChapters,
          identity,
        },
        streak: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate,
        },
        serverCursor: String(Date.now()),
        serverTime: clock.now().toISOString(),
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
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  }
}
