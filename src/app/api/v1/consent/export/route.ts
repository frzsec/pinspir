import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/db';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { UnauthorizedError, formatErrorEnvelope } from '@/lib/errors';
import { defaultClock } from '@/lib/clock';

import { getAuth } from '@/lib/auth/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession(req);
    if (!session) {
      throw new UnauthorizedError();
    }
    
    const body = await req.json().catch(() => ({}));
    const { passphrase } = body;
    if (!passphrase || typeof passphrase !== 'string') {
      return NextResponse.json({ success: false, code: 'MISSING_PASSPHRASE', message: 'Passphrase diperlukan untuk mengekspor data.' }, { status: 400 });
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

    // 1. User profile
    const userRes = await pool.query(
      `SELECT id, role, player_code, nickname, avatar_config, created_at FROM users WHERE id = $1;`,
      [userId]
    );

    // 2. Cohort memberships
    const cohortsRes = await pool.query(
      `SELECT c.id, c.name, c.cohort_code, c.academic_year, s.name AS school_name, cm.joined_at
       FROM cohort_members cm
       JOIN cohorts c ON c.id = cm.cohort_id
       JOIN schools s ON s.id = c.school_id
       WHERE cm.user_id = $1;`,
      [userId]
    );

    // 3. Playthrough attempts
    const attemptsRes = await pool.query(
      `SELECT id, release_id, chapter_id, attempt_number, status, score_mastery, outcome_tags, started_at, completed_at
       FROM playthrough_attempts
       WHERE user_id = $1;`,
      [userId]
    );

    // 4. Reward ledger entries
    const ledgerRes = await pool.query(
      `SELECT release_id, source_node_id, reward_type, amount, reason, created_at
       FROM reward_ledger
       WHERE user_id = $1
       ORDER BY created_at ASC;`,
      [userId]
    );

    // 5. Consent history
    const consentsRes = await pool.query(
      `SELECT consent_type, granted, granted_at, revoked_at
       FROM user_consents
       WHERE user_id = $1;`,
      [userId]
    );

    // 6. Projections
    const projRes = await pool.query(
      `SELECT total_xp, total_stars, completed_chapters FROM player_projections WHERE user_id = $1;`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      exportData: {
        user: userRes.rows[0],
        cohorts: cohortsRes.rows,
        playthroughs: attemptsRes.rows,
        rewards: ledgerRes.rows,
        consents: consentsRes.rows,
        projection: projRes.rows[0] || null,
      },
      exportedAt: defaultClock.nowIso(),
      license: 'Finspire User Data Portability Guarantee',
    });
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
