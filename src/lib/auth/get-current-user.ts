import { NextRequest } from 'next/server';
import { getAuth } from './auth';
import { getDb } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

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

/**
 * Resolve the authenticated user session from a Next.js request using Better Auth.
 * 
 * Better Auth handles cookie signing, bearer tokens, and session expiry.
 * We then enrich the session with custom fields (avatarConfig, role, playerCode) from our DB.
 */
export async function getCurrentUserSession(req: NextRequest): Promise<UserSession | null> {
  const auth = getAuth();
  
  // Call Better Auth's getSession API
  const sessionResult = await auth.api.getSession({
    headers: req.headers,
  });

  if (!sessionResult || !sessionResult.session || !sessionResult.user) {
    return null;
  }

  // Enrich with custom DB fields
  const db = getDb();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, sessionResult.user.id),
  });

  if (!dbUser || dbUser.deletedAt) {
    return null;
  }

  // Update idle expiry tracking (touchSession equivalent logic)
  // Better Auth handles basic expiry, but we can maintain idle_expires_at if needed,
  // though Better Auth handles sliding sessions if configured.

  return {
    user: {
      id: dbUser.id,
      role: dbUser.role,
      playerCode: dbUser.playerCode,
      nickname: dbUser.nickname,
      avatarConfig: dbUser.avatarConfig as Record<string, unknown>,
    },
    sessionToken: sessionResult.session.token,
    expiresAt: sessionResult.session.expiresAt,
  };
}

export async function getCurrentUser(req: NextRequest): Promise<UserSession['user'] | null> {
  const session = await getCurrentUserSession(req);
  return session ? session.user : null;
}
