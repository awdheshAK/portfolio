import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { ipFromRequest, hashIp } from '@/lib/audit';

const Schema = z.object({ watchedSec: z.number().min(0).optional() });

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  const parsed = Schema.safeParse(await req.json().catch(() => ({})));

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) throw new ApiError('Video not found.', 404);

  await prisma.$transaction([
    prisma.view.create({
      data: {
        videoId: video.id,
        userId: user?.id,
        watchedSec: parsed.success ? parsed.data.watchedSec ?? 0 : 0,
        ipHash: hashIp(ipFromRequest(req)),
      },
    }),
    prisma.video.update({ where: { id: video.id }, data: { viewCount: { increment: 1 } } }),
  ]);

  return NextResponse.json({ success: true });
});
