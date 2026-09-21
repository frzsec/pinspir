import { getPool } from '@/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    const pool = getPool();
    // Delete expired entries
    await pool.query('DELETE FROM rate_limit_entries WHERE reset_at < NOW()');

    // UPSERT the rate limit entry
    const res = await pool.query(
      `INSERT INTO rate_limit_entries (key, count, reset_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE
       SET count = rate_limit_entries.count + 1
       RETURNING count, EXTRACT(EPOCH FROM (reset_at - NOW())) AS reset_in_seconds`,
      [key, resetAt]
    );

    const count = parseInt(res.rows[0].count, 10);
    const resetInSeconds = Math.max(1, Math.ceil(parseFloat(res.rows[0].reset_in_seconds)));

    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    return {
      allowed: true,
      remaining: limit - count,
      resetInSeconds,
    };
  } catch (error) {
    // Fail-open if DB is unavailable
    console.warn('[RateLimiter] Database error, failing open', error);
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM rate_limit_entries WHERE key = $1', [key]);
  } catch (error) {
    console.warn('[RateLimiter] Failed to reset rate limit', error);
  }
}
