import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { buildSignedAssetUrl } from '@/lib/signedUrl';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';
import { ipFromRequest, hashIp, logAudit } from '@/lib/audit';
import { env } from '@/lib/env';

const Schema = z.object({ quality: z.string().min(1).max(20) });

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: { files: { where: { kind: { in: ['ORIGINAL', 'RENDITION'] } } } },
  });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.status !== 'PUBLISHED' && video.status !== 'READY') throw new ApiError('Download unavailable.', 404);

  const options = video.files.map((f) => ({
    label: f.kind === 'ORIGINAL' ? 'Original' : f.label,
    sizeBytes: f.sizeBytes.toString(),
  }));

  return NextResponse.json({ options });
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();

  const rl = checkRateLimit(clientKeyFromRequest(req, `download-req:${user?.id ?? ipFromRequest(req)}`), env.rateLimit.downloadMax, 60_000);
  if (!rl.allowed) throw new ApiError('Download rate limit exceeded. Please try again shortly.', 429);

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Missing quality selection.', 400);

  const video = await prisma.video.findUnique({
    where: { id: params.id },
    include: { files: { where: { kind: { in: ['ORIGINAL', 'RENDITION'] } } } },
  });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.status !== 'PUBLISHED' && video.status !== 'READY') throw new ApiError('Download unavailable.', 404);
  if (video.visibility === 'PRIVATE' && video.ownerId !== user?.id) throw new ApiError('Download unavailable.', 403);

  const wantsOriginal = parsed.data.quality.toLowerCase() === 'original';
  const file = video.files.find((f) => (wantsOriginal ? f.kind === 'ORIGINAL' : f.label === parsed.data.quality));
  if (!file) throw new ApiError('The requested quality is not available for this video.', 404);

  const bucket = file.kind === 'ORIGINAL' ? 'videos' : 'transcoded';
  const url = buildSignedAssetUrl(bucket, file.storageKey, { userId: user?.id, purpose: 'download', ttlSeconds: 300 });

  await prisma.$transaction([
    prisma.download.create({
      data: {
        videoId: video.id,
        userId: user?.id,
        quality: parsed.data.quality,
        ipHash: hashIp(ipFromRequest(req)),
      },
    }),
    prisma.video.update({ where: { id: video.id }, data: { downloadCount: { increment: 1 } } }),
  ]);

  await logAudit({ userId: user?.id, action: 'video.download.request', targetType: 'Video', targetId: video.id, ip: ipFromRequest(req) });

  return NextResponse.json({ url, expiresInSeconds: 300 });
});
