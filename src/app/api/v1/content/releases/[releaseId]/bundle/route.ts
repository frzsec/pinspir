import { NextRequest, NextResponse } from 'next/server';
import { getReleaseBundle } from '@/lib/game/content-loader';
import { formatErrorEnvelope, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ releaseId: string }> }
) {
  try {
    const { releaseId } = await params;
    const bundle = getReleaseBundle(releaseId);

    if (!bundle) {
      throw new NotFoundError(`Rilis konten dengan ID '${releaseId}' tidak ditemukan.`);
    }

    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === bundle.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: bundle.etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return NextResponse.json(
      {
        releaseId,
        manifest: bundle.manifest,
        chapters: bundle.chapters,
      },
      {
        status: 200,
        headers: {
          ETag: bundle.etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
        },
      }
    );
  } catch (err) {
    const { status, body } = formatErrorEnvelope(err);
    return NextResponse.json(body, { status });
  }
}
