/**
 * Serves storage objects (video renditions, thumbnails, previews) only when
 * presented with a valid, non-expired signed token. Internal storage keys
 * and filesystem paths are never exposed directly - the client only ever
 * sees this route plus an opaque token, exactly like a pre-signed cloud
 * storage URL would look.
 */
import { NextResponse } from 'next/server';
import { verifySignedToken } from '@/lib/signedUrl';
import { getStorageProvider, type StorageBucket } from '@/lib/storage';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';
import { logAudit, ipFromRequest } from '@/lib/audit';
import { env } from '@/lib/env';

const MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function mimeFor(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

export async function GET(req: Request, { params }: { params: { bucket: string; key: string } }) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing access token.' }, { status: 401 });

  const payload = verifySignedToken(token);
  if (!payload) return NextResponse.json({ error: 'This link has expired or is invalid.' }, { status: 403 });

  const key = decodeURIComponent(params.key);
  if (payload.bucket !== params.bucket || payload.key !== key) {
    return NextResponse.json({ error: 'Token does not match the requested resource.' }, { status: 403 });
  }

  if (payload.purpose === 'download') {
    const rl = checkRateLimit(clientKeyFromRequest(req, `download:${payload.userId ?? 'anon'}`), env.rateLimit.downloadMax, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Download rate limit exceeded. Please try again shortly.' }, { status: 429 });
    }
  }

  const storage = getStorageProvider();
  const stat = await storage.stat(params.bucket as StorageBucket, key);
  if (!stat) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

  const mime = mimeFor(key);
  const range = req.headers.get('range');

  const headers = new Headers({
    'Content-Type': mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  });

  if (payload.purpose === 'download') {
    headers.set('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
    if (payload.userId) {
      await logAudit({ userId: payload.userId, action: 'video.download.serve', metadata: { key }, ip: ipFromRequest(req) });
    }
  }

  if (range) {
    const match = range.match(/bytes=(\d+)-(\d+)?/);
    const start = match ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : stat.size - 1;
    const chunkSize = end - start + 1;

    headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    headers.set('Content-Length', String(chunkSize));

    const stream = storage.createReadStream(params.bucket as StorageBucket, key, { start, end });
    return new NextResponse(stream as any, { status: 206, headers });
  }

  headers.set('Content-Length', String(stat.size));
  const stream = storage.createReadStream(params.bucket as StorageBucket, key);
  return new NextResponse(stream as any, { status: 200, headers });
}

// Avoid Next.js trying to statically analyze this route's body size.
export const dynamic = 'force-dynamic';
