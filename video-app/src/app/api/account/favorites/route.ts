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
    prisma.favorite.findMany({
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    videos: entries.map((e) => serializeVideoCard(e.video as any, user.id)),
    hasMore: page * limit < total,
    total,
  });
});
