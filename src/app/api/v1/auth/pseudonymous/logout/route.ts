import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth/auth';
import { defaultClock } from '@/lib/clock';
import { formatErrorEnvelope } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth();
    
    // Call Better Auth signOut, which revokes the session and clears the cookie
    const authResponse = (await auth.api.signOut({
      headers: req.headers,
      asResponse: true,
    })) as Response;

    const headers = new Headers(authResponse.headers);

    return NextResponse.json(
      {
        success: true,
        message: 'Sesi berhasil diakhiri.',
        serverTime: defaultClock.nowIso(),
      },
      {
        status: 200,
        headers: headers,
      }
    );
  } catch (err) {
    const { statusCode, envelope } = formatErrorEnvelope(err);
    return NextResponse.json(envelope, { status: statusCode });
  }
}
