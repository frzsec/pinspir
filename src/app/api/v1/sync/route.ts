import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { processSyncBatch } from '@/lib/game/sync-handler';
import { formatErrorEnvelope, UnauthorizedError, BadRequestError } from '@/lib/errors';
import type { SyncBatchRequest } from '@/lib/game/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError('Sesi tidak valid atau telah kedaluwarsa.');
    }

    const body = (await req.json()) as SyncBatchRequest;
    if (!body || !body.batchId || !Array.isArray(body.actions)) {
      throw new BadRequestError('Payload sync batch tidak valid: batchId dan actions wajib ada.');
    }

    if (body.actions.length > 50) {
      throw new BadRequestError('Ukuran batch melebihi batas maksimal 50 aksi.');
    }

    const response = await processSyncBatch(
      user.id,
      body.batchId,
      body.installationId,
      body.actions
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
      },
    });
  } catch (err) {
    const { status, body } = formatErrorEnvelope(err);
    return NextResponse.json(body, {
      status,
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  }
}
