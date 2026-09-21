import { NextRequest, NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { cohorts, cohortMembers } from '@/db/schema/schools';
import { users } from '@/db/schema/users';
import { playerProjections, playerStreaks } from '@/db/schema/projections';
import { formatErrorEnvelope, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError('Sesi tidak valid atau telah kedaluwarsa.');
    }

    const { id: cohortId } = await params;

    // 1. Verify cohort exists
    const cohortRows = await db.select().from(cohorts).where(eq(cohorts.id, cohortId));
    if (cohortRows.length === 0) {
      throw new NotFoundError('Kelas cohort tidak ditemukan.');
    }
    const cohort = cohortRows[0];

    // 2. Strict BOLA check: User must be teacher owner OR an enrolled member of this cohort
    const isTeacher = user.role === 'teacher' && cohort.teacherId === user.id;
    const isMember = (
      await db
        .select()
        .from(cohortMembers)
        .where(
          and(
            eq(cohortMembers.cohortId, cohortId),
            eq(cohortMembers.userId, user.id)
          )
        )
    ).length > 0;

    if (!isTeacher && !isMember && user.role !== 'admin') {
      throw new ForbiddenError('Anda tidak memiliki hak akses ke leaderboard kelas cohort ini.');
    }

    // 3. Query pseudonymous leaderboard data
      const rows = await db
      .select({
        userId: users.id,
        displayAlias: users.displayAlias,
        nickname: users.nickname,
        totalXp: sql<number>`coalesce(${playerProjections.totalXp}, 0)`,
        totalStars: sql<number>`coalesce(${playerProjections.totalStars}, 0)`,
        currentStreak: sql<number>`coalesce(${playerStreaks.currentStreak}, 0)`,
      })
      .from(cohortMembers)
      .innerJoin(users, eq(cohortMembers.userId, users.id))
      .leftJoin(playerProjections, eq(users.id, playerProjections.userId))
      .leftJoin(playerStreaks, eq(users.id, playerStreaks.userId))
      .where(
        and(
          eq(cohortMembers.cohortId, cohortId),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .orderBy(sql`${playerProjections.totalXp} DESC NULLS LAST`, sql`${playerProjections.totalStars} DESC NULLS LAST`);

    const leaderboard = rows.map((r, index) => ({
      rank: index + 1,
      displayAlias: r.displayAlias,
      nickname: r.nickname,
      totalXp: Number(r.totalXp),
      totalStars: Number(r.totalStars),
      currentStreak: Number(r.currentStreak),
      isSelf: r.userId === user.id,
    }));

    return NextResponse.json(
      {
        cohortId: cohort.id,
        cohortName: cohort.name,
        leaderboard,
        serverTime: new Date().toISOString(),
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
