import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserSession } from '@/lib/auth/get-current-user';

export async function GET(req: NextRequest) {
  const session = await getCurrentUserSession(req);
  return NextResponse.json({
    status: 'ok',
    authenticated: !!session,
    user: session?.user || null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUserSession(req);
  return NextResponse.json({
    status: 'ok',
    authenticated: !!session,
    user: session?.user || null,
  });
}
