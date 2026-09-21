import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

import { getAuth } from '@/lib/auth/auth';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }

    const body = await req.json().catch(() => ({}));
    const { passphrase } = body;
    if (!passphrase || typeof passphrase !== 'string') {
      return NextResponse.json({ success: false, code: 'MISSING_PASSPHRASE', message: 'Passphrase diperlukan untuk menghapus akun.' }, { status: 400 });
    }

    const auth = getAuth();
    try {
      // Re-authenticate using Better Auth's signInUsername API
      const reAuthRes = await auth.api.signInUsername({
         body: {
            username: session.user.playerCode || '',
            password: passphrase
         }
      });
      if (!reAuthRes || !reAuthRes.user) {
         throw new UnauthorizedError('Passphrase salah.');
      }
    } catch {
      return NextResponse.json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Passphrase salah.' }, { status: 401 });
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

      const clearCookie = 'finspire.session_token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT';

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
