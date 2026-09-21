import { NextResponse } from 'next/server';
import { getPool } from '@/db';
import { defaultClock } from '@/lib/clock';
import { formatErrorEnvelope, ServiceUnavailableError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT 1 AS ready_check;');

    if (!result || result.rows[0]?.ready_check !== 1) {
      throw new ServiceUnavailableError('Database connectivity verification failed.');
    }

    return NextResponse.json(
      {
        status: 'ready',
        database: 'connected',
        serverTime: defaultClock.nowIso(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    logger.error('[Health Ready] Readiness probe check failed', err);
    const { statusCode, envelope } = formatErrorEnvelope(
      new ServiceUnavailableError('Layanan basis data tidak siap atau koneksi terputus.')
    );
    return NextResponse.json(envelope, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
