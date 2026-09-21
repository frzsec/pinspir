import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { playthroughAttempts, gameplayActions } from '@/db/schema/gameplay';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { formatErrorEnvelope, UnauthorizedError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError('Sesi tidak valid.');
    }

    const { id: attemptId } = await params;

    const attemptRows = await db
      .select()
      .from(playthroughAttempts)
      .where(
        and(
          eq(playthroughAttempts.id, attemptId),
          eq(playthroughAttempts.userId, user.id)
        )
      );

    if (attemptRows.length === 0) {
      throw new NotFoundError('Attempt gameplay tidak ditemukan.');
    }

    const attempt = attemptRows[0];

    // Fetch actions taken in this attempt
    const actions = await db
      .select({
        actionId: gameplayActions.actionId,
        clientSequence: gameplayActions.clientSequence,
        sceneNodeId: gameplayActions.sceneNodeId,
        choiceId: gameplayActions.choiceId,
        occurredAt: gameplayActions.occurredAt,
      })
      .from(gameplayActions)
      .where(eq(gameplayActions.attemptId, attemptId))
      .orderBy(gameplayActions.clientSequence);

    return NextResponse.json(
      {
        attempt: {
          id: attempt.id,
          chapterId: attempt.chapterId,
          releaseId: attempt.releaseId,
          status: attempt.status,
          scoreMastery: attempt.scoreMastery,
          startedAt: attempt.startedAt,
          completedAt: attempt.completedAt,
        },
        actions,
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
