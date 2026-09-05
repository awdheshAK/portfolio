import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling } from '@/lib/apiAuth';
import { serializeVideoDetail } from '@/lib/serializers';

export const GET = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: { ownerId: user.id },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
        tags: { include: { tag: true } },
        files: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where: { ownerId: user.id } }),
  ]);

  return NextResponse.json({
    videos: videos.map((v) => serializeVideoDetail(v as any, user.id)),
    hasMore: page * limit < total,
    total,
  });
});
