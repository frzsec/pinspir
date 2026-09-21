import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { BadRequestError, NotFoundError, UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const body = await req.json().catch(() => ({}));
    const rawCode = body.cohortCode;
    if (!rawCode) {
      throw new BadRequestError('Kode kelas (cohortCode) wajib disertakan.');
    }

    const cohortCode = String(rawCode).trim().toUpperCase();
    const pool = getPool();

    const cohortRes = await pool.query(
      `SELECT c.id, c.name, c.cohort_code, c.academic_year, s.name AS school_name
       FROM cohorts c
       JOIN schools s ON s.id = c.school_id
       WHERE c.cohort_code = $1 AND c.is_active = true;`,
      [cohortCode]
    );

    if (cohortRes.rowCount === 0) {
      throw new NotFoundError('Kode kelas tidak ditemukan atau kelas sudah tidak aktif.');
    }

    const cohort = cohortRes.rows[0];

    await pool.query(
      `INSERT INTO cohort_members (cohort_id, user_id, joined_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (cohort_id, user_id) DO NOTHING;`,
      [cohort.id, session.user.id]
    );

    return NextResponse.json({
      success: true,
      cohort: {
        id: cohort.id,
        name: cohort.name,
        cohortCode: cohort.cohort_code,
        academicYear: cohort.academic_year,
        schoolName: cohort.school_name,
      },
      message: `Berhasil bergabung ke kelas ${cohort.name}.`,
      serverTime: defaultClock.nowIso(),
    });
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
