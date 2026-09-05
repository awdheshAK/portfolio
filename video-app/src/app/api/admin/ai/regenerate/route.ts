import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { generateVideoMetadata } from '@/lib/ai';

const Schema = z.object({ videoId: z.string() });

export const POST = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Missing videoId.', 400);

  const video = await prisma.video.findUnique({ where: { id: parsed.data.videoId }, include: { category: true } });
  if (!video) throw new ApiError('Video not found.', 404);

  const metadata = await generateVideoMetadata(video.title, {
    durationSec: video.durationSec ?? 0,
    width: video.width,
    height: video.height,
    videoCodec: null,
    audioCodec: null,
    bitrateKbps: null,
    format: null,
  }, video.category?.name);

  await prisma.video.update({
    where: { id: video.id },
    data: { language: metadata.language, chapters: metadata.chapters as any, aiGenerated: true, aiMetadata: metadata as any },
  });

  return NextResponse.json({ metadata });
});
