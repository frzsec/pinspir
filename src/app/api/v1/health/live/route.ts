import { NextResponse } from 'next/server';
import { defaultClock } from '@/lib/clock';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      serverTime: defaultClock.nowIso(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
