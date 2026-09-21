import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { ForbiddenError, NotFoundError, UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const { id: cohortId } = await params;
    const pool = getPool();

    // 1. Fetch cohort
    const cohortRes = await pool.query(
      `SELECT c.id, c.name, c.cohort_code, c.academic_year, c.teacher_id, s.name AS school_name
       FROM cohorts c
       JOIN schools s ON s.id = c.school_id
       WHERE c.id = $1;`,
      [cohortId]
    );

    if (cohortRes.rowCount === 0) {
      throw new NotFoundError('Kelas tidak ditemukan.');
    }

    const cohort = cohortRes.rows[0];

    // 2. Strict Row-Level Authorization / BOLA Check: Only the assigned teacher or admin can access
    if (session.user.role !== 'admin' && cohort.teacher_id !== session.user.id) {
      throw new ForbiddenError('Anda tidak memiliki wewenang mengakses data kelas ini.');
    }

    // 3. Query member count and aggregated stats
    const statsRes = await pool.query(
      `SELECT
         COUNT(cm.user_id) AS total_students,
         COUNT(DISTINCT CASE WHEN pa.chapter_id = 'chapter-01' AND pa.status = 'completed' THEN cm.user_id END) AS completed_ch1,
         COUNT(DISTINCT CASE WHEN pa.chapter_id = 'chapter-02' AND pa.status = 'completed' THEN cm.user_id END) AS completed_ch2,
         COALESCE(AVG(pa.score_mastery), 0) AS average_mastery_score
       FROM cohort_members cm
       LEFT JOIN playthrough_attempts pa ON pa.user_id = cm.user_id
       WHERE cm.cohort_id = $1;`,
      [cohortId]
    );

    const stats = statsRes.rows[0];

    return NextResponse.json({
      success: true,
      cohort: {
        id: cohort.id,
        name: cohort.name,
        cohortCode: cohort.cohort_code,
        academicYear: cohort.academic_year,
        schoolName: cohort.school_name,
      },
      summary: {
        totalStudents: parseInt(stats.total_students, 10) || 0,
        completedChapter1: parseInt(stats.completed_ch1, 10) || 0,
        completedChapter2: parseInt(stats.completed_ch2, 10) || 0,
        averageMasteryScore: Math.round(parseFloat(stats.average_mastery_score) || 0),
      },
      serverTime: defaultClock.nowIso(),
    });
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
