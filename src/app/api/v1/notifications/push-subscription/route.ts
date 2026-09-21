import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { formatErrorEnvelope, UnauthorizedError, BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError('Sesi tidak valid.');
    }

    const body = await req.json();
    if (!body || typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) {
      throw new BadRequestError('Endpoint push subscription HTTPS wajib ada dan valid.');
    }

    const action = body.action === 'unsubscribe' ? 'unsubscribe' : 'subscribe';

    return NextResponse.json(
      {
        status: 'ok',
        action,
        userId: user.id,
        serverTime: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
          'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
        },
      }
    );
  } catch (err) {
    const { status, body } = formatErrorEnvelope(err);
    return NextResponse.json(body, { status });
  }
}
