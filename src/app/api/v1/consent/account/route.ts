import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { getClearSessionCookieHeader } from '@/lib/auth/session';
import { UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const userId = session.user.id;
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Soft-delete user & dissociate player code to release constraint
      await client.query(
        `UPDATE users
         SET deleted_at = NOW(),
             player_code = CONCAT('DELETED-', id),
             updated_at = NOW()
         WHERE id = $1;`,
        [userId]
      );

      // 2. Revoke all active sessions
      await client.query('DELETE FROM sessions WHERE user_id = $1;', [userId]);

      // 3. Dissociate active credentials
      await client.query('DELETE FROM accounts WHERE user_id = $1;', [userId]);

      await client.query('COMMIT');

      const clearCookie = getClearSessionCookieHeader();

      return NextResponse.json(
        {
          success: true,
          message: 'Akun Anda berhasil dinonaktifkan dan dijadwalkan untuk penghapusan permanen. Sesi aktif telah dicabut.',
          serverTime: defaultClock.nowIso(),
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': clearCookie,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
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
