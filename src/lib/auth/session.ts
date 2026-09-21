import { randomBytes } from 'node:crypto';
import { getPool } from '@/db';
import { getAppConfig } from '@/lib/config/env';

export interface UserSession {
  user: {
    id: string;
    role: string;
    playerCode: string | null;
    nickname: string;
    avatarConfig: Record<string, unknown>;
  };
  sessionToken: string;
  expiresAt: Date;
}

export const SESSION_COOKIE_NAME = 'finspire_session';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function getSessionCookieHeader(token: string, expiresAt: Date): string {
  const config = getAppConfig();
  const isProd = config.nodeEnv === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`;
}

export function getClearSessionCookieHeader(): string {
  const config = getAppConfig();
  const isProd = config.nodeEnv === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0${secureFlag}`;
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const pool = getPool();
  await pool.query(
    `INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW());`,
    [userId, token, expiresAt, ipAddress || null, userAgent || null]
  );

  return { token, expiresAt };
}

export async function getSessionByToken(token: string): Promise<UserSession | null> {
  if (!token) return null;

  const pool = getPool();
  const res = await pool.query(
    `SELECT s.token, s.expires_at, u.id, u.role, u.player_code, u.nickname, u.avatar_config, u.deleted_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW() AND u.deleted_at IS NULL;`,
    [token]
  );

  if (res.rowCount === 0) {
    return null;
  }

  const row = res.rows[0];
  return {
    user: {
      id: row.id,
      role: row.role,
      playerCode: row.player_code,
      nickname: row.nickname,
      avatarConfig: (row.avatar_config as Record<string, unknown>) || {},
    },
    sessionToken: row.token,
    expiresAt: new Date(row.expires_at),
  };
}

export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  const pool = getPool();
  await pool.query('DELETE FROM sessions WHERE token = $1;', [token]);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const pool = getPool();
  await pool.query('DELETE FROM sessions WHERE user_id = $1;', [userId]);
}
