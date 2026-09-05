import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, withErrorHandling, ApiError } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { videoId: string } }) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError('Authentication required.', 401);

  const video = await prisma.video.findUnique({ where: { id: params.videoId } });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.ownerId !== user.id && user.role !== 'ADMIN') throw new ApiError('Forbidden.', 403);

  const job = await prisma.videoProcessingJob.findFirst({
    where: { videoId: params.videoId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    videoStatus: video.status,
    job: job
      ? { status: job.status, progress: job.progress, step: job.step, errorMessage: job.errorMessage }
      : null,
  });
});
