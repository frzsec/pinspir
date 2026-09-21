import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';
import { revokeSession, getClearSessionCookieHeader } from '@/lib/auth/session';
import { defaultClock } from '@/lib/clock';

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession(req);
  if (session?.sessionToken) {
    await revokeSession(session.sessionToken);
  }

  const clearCookieHeader = getClearSessionCookieHeader();

  return NextResponse.json(
    {
      success: true,
      message: 'Sesi berhasil diakhiri.',
      serverTime: defaultClock.nowIso(),
    },
    {
      status: 200,
      headers: {
        'Set-Cookie': clearCookieHeader,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
