import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getAllChapters, ensureContentLoaded } from '@/lib/game/content-loader';
import { playerProjections } from '@/db/schema/projections';
import { formatErrorEnvelope } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    let completedChapters: string[] = [];

    if (user) {
      const proj = await db
        .select()
        .from(playerProjections)
        .where(eq(playerProjections.userId, user.id));
      completedChapters = proj[0]?.completedChapters ?? [];
    }

    await ensureContentLoaded();
    const chapters = getAllChapters().map((ch) => {
      // Chapter 1 is always unlocked
      // Chapter 2 is unlocked if prerequisites are met (chapter-01 completed)
      const isUnlocked =
        ch.prerequisites.length === 0 ||
        ch.prerequisites.every((reqId) => completedChapters.includes(reqId));

      return {
        chapterId: ch.chapterId,
        chapterIndex: ch.chapterIndex,
        title: ch.title,
        subtitle: ch.subtitle,
        themeCode: ch.themeCode,
        scopeExplanation: ch.scopeExplanation,
        learningObjectives: ch.learningObjectives,
        targetIdentity: ch.targetIdentity,
        badge: ch.badge,
        prerequisites: ch.prerequisites,
        isUnlocked,
      };
    });

    return NextResponse.json(
      {
        chapters,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': user ? 'private, no-store' : 'public, max-age=300',
          'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
        },
      }
    );
  } catch (err) {
    const { status, body } = formatErrorEnvelope(err);
    return NextResponse.json(body, { status });
  }
}
