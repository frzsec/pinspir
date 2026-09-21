import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { hashPassphrase } from '@/lib/auth/passphrase';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';
import { randomBytes } from 'node:crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const { id: cohortId } = await params;
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId;
    const reason = (body.reason || 'Permohonan reset sandi terbimbing oleh guru').trim().slice(0, 255);

    if (!targetUserId) {
      throw new BadRequestError('targetUserId wajib disertakan.');
    }

    const pool = getPool();

    // 1. Verify cohort ownership: caller must be the teacher of this cohort (or admin)
    const cohortRes = await pool.query(
      `SELECT id, name, teacher_id FROM cohorts WHERE id = $1;`,
      [cohortId]
    );

    if (cohortRes.rowCount === 0) {
      throw new NotFoundError('Kelas tidak ditemukan.');
    }

    const cohort = cohortRes.rows[0];
    if (session.user.role !== 'admin' && cohort.teacher_id !== session.user.id) {
      throw new ForbiddenError('Hanya guru pengampu kelas ini yang berhak mereset sandi murid.');
    }

    // 2. Verify target user is indeed an enrolled student in this cohort
    const memberCheck = await pool.query(
      `SELECT cm.user_id, u.player_code, u.nickname
       FROM cohort_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.cohort_id = $1 AND cm.user_id = $2;`,
      [cohortId, targetUserId]
    );

    if (memberCheck.rowCount === 0) {
      throw new NotFoundError('Murid target tidak terdaftar sebagai anggota di kelas ini.');
    }

    const targetStudent = memberCheck.rows[0];

    // 3. Generate a friendly temporary passphrase: e.g. "PINTAR-" + 4 digits
    const tempDigits = Math.floor(1000 + Math.random() * 9000);
    const tempWord = ['BERANI', 'PINTAR', 'CERMAT', 'HEMAT', 'BIJAK'][randomBytes(1)[0] % 5];
    const temporaryPassphrase = `${tempWord}-${tempDigits}`;

    const newHash = await hashPassphrase(temporaryPassphrase);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update password hash
      await client.query(
        `UPDATE accounts
         SET password_hash = $1, updated_at = NOW()
         WHERE user_id = $2 AND provider_id = 'credential';`,
        [newHash, targetUserId]
      );

      // Audit log the reset action
      await client.query(
        `INSERT INTO credential_reset_audits (
           target_user_id, teacher_id, cohort_id, reason, reset_at
         )
         VALUES ($1, $2, $3, $4, NOW());`,
        [targetUserId, session.user.id, cohortId, reason]
      );

      // Invalidate target user's active sessions for security
      await client.query(
        `DELETE FROM sessions WHERE user_id = $1;`,
        [targetUserId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Kata sandi murid berhasil direset. Sesi lama telah dicabut.',
        student: {
          id: targetStudent.user_id,
          nickname: targetStudent.nickname,
          playerCode: targetStudent.player_code,
        },
        temporaryPassphrase,
        serverTime: defaultClock.nowIso(),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
