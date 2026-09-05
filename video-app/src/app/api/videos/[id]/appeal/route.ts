import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { sanitizeTextField } from '@/lib/validation';

const Schema = z.object({ message: z.string().min(1).max(1000) });

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Please include a message explaining your appeal.', 400);

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.ownerId !== user.id) throw new ApiError('Forbidden.', 403);

  const report = await prisma.report.findFirst({
    where: { videoId: video.id, status: 'ACTIONED' },
    orderBy: { updatedAt: 'desc' },
  });
  if (!report) throw new ApiError('There is no moderation decision on this video to appeal.', 400);

  await prisma.report.update({
    where: { id: report.id },
    data: { status: 'APPEALED', appealNote: sanitizeTextField(parsed.data.message, 1000) },
  });

  return NextResponse.json({ success: true });
});
