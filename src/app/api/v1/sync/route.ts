import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { processSyncBatch } from '@/lib/game/sync-handler';
import { ensureContentLoaded } from '@/lib/game/content-loader';
import { formatErrorEnvelope, UnauthorizedError, BadRequestError } from '@/lib/errors';
import type { SyncBatchRequest } from '@/lib/game/types';
import { z } from 'zod';

const SyncActionInputSchema = z.object({
  actionId: z.string().uuid(),
  attemptId: z.string().uuid().optional(),
  clientSequence: z.number().int().nonnegative(),
  actionType: z.enum([
    'START_PLAYTHROUGH',
    'CHOICE_SELECTED',
    'COMPLETE_MICROLEARNING',
    'SUBMIT_MINIGAME',
    'SUBMIT_BOSS'
  ]),
  sceneNodeId: z.string().optional(),
  choiceId: z.string().optional(),
  contentVersion: z.string().optional(),
  clientOccurredAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
}).strict();

const SyncBatchRequestSchema = z.object({
  protocolVersion: z.string().optional(),
  batchId: z.string().min(1),
  installationId: z.string().uuid().optional(),
  lastServerCursor: z.string().optional(),
  actions: z.array(SyncActionInputSchema).max(50),
}).strict();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentLengthStr = req.headers.get('content-length');
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10);
      if (contentLength > 100 * 1024) { // 100 KiB limit
        return NextResponse.json(
          formatErrorEnvelope(new BadRequestError('Payload terlalu besar (maksimal 100 KiB).')).envelope,
          { status: 413, headers: { 'Cache-Control': 'private, no-store' } }
        );
      }
    }

    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError('Sesi tidak valid atau telah kedaluwarsa.');
    }

    const rawBody = await req.json();
    const parseResult = SyncBatchRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      throw new BadRequestError(`Payload sync batch tidak valid: ${parseResult.error.message}`);
    }
    
    const body = parseResult.data as SyncBatchRequest;

    // Ensure active content release is loaded
    await ensureContentLoaded();

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
