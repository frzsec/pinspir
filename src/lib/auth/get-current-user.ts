import { NextRequest } from 'next/server';
import { getSessionByToken, SESSION_COOKIE_NAME, UserSession } from './session';

export async function getCurrentUserSession(req: NextRequest): Promise<UserSession | null> {
  // 1. Check HTTP cookie
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    const session = await getSessionByToken(cookie.value);
    if (session) return session;
  }

  // 2. Check Authorization Bearer header (for headless/API clients)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = await getSessionByToken(token);
    if (session) return session;
  }

  return null;
}

export async function getCurrentUser(req: NextRequest): Promise<UserSession['user'] | null> {
  const session = await getCurrentUserSession(req);
  return session ? session.user : null;
}


