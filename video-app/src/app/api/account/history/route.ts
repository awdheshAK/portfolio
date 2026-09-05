import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling } from '@/lib/apiAuth';
import { serializeVideoCard } from '@/lib/serializers';

export const GET = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const [entries, total] = await Promise.all([
    prisma.watchHistory.findMany({
      where: { userId: user.id },
      include: {
        video: {
          include: {
            owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
            category: true,
            tags: { include: { tag: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.watchHistory.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    videos: entries.map((e) => ({
      ...serializeVideoCard(e.video as any, user.id),
      progressSec: e.progressSec,
      completed: e.completed,
    })),
    hasMore: page * limit < total,
    total,
  });
});

export const DELETE = withErrorHandling(async () => {
  const user = await requireUser();
  await prisma.watchHistory.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true });
});
