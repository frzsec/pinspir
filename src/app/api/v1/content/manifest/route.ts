import { NextRequest, NextResponse } from 'next/server';
import { getActiveReleaseManifest } from '@/lib/game/content-loader';
import { formatErrorEnvelope } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const manifest = getActiveReleaseManifest();

    return NextResponse.json(
      {
        manifest,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
        },
      }
    );
  } catch (err) {
    const { status, body } = formatErrorEnvelope(err);
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
