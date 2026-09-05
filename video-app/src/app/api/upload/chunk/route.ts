import { NextResponse } from 'next/server';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { readUploadSession, writeUploadSession, appendChunk } from '@/lib/uploadSession';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();

  const rl = checkRateLimit(clientKeyFromRequest(req, `chunk:${user.id}`), 600, 60_000);
  if (!rl.allowed) throw new ApiError('Upload rate limit exceeded. Slow down.', 429);

  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get('uploadId');
  const index = Number(searchParams.get('index'));
  if (!uploadId || Number.isNaN(index) || index < 0) {
    throw new ApiError('Missing or invalid uploadId/index.', 400);
  }

  const session = await readUploadSession(uploadId);
  if (!session) throw new ApiError('Upload session not found or expired.', 404);
  if (session.userId !== user.id) throw new ApiError('Forbidden.', 403);

  const arrayBuffer = await req.arrayBuffer();
  const chunk = Buffer.from(arrayBuffer);
  if (chunk.length === 0) throw new ApiError('Empty chunk.', 400);

  const chunkSizeHeader = Number(req.headers.get('x-chunk-size'));
  const offset = index * (chunkSizeHeader || chunk.length);

  if (offset + chunk.length > session.fileSize) {
    throw new ApiError('Chunk exceeds declared file size.', 400);
  }

  await appendChunk(uploadId, offset, chunk);

  session.receivedBytes = Math.max(session.receivedBytes, offset + chunk.length);
  await writeUploadSession(session);

  return NextResponse.json({ receivedBytes: session.receivedBytes, fileSize: session.fileSize });
});
