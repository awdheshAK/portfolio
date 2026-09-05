import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const [entries, total] = await Promise.all([
    prisma.download.findMany({
      where: { userId: user.id },
      include: { video: { select: { id: true, title: true, slug: true, thumbnailKey: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.download.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    downloads: entries.map((e) => ({
      id: e.id,
      quality: e.quality,
      createdAt: e.createdAt,
      video: { id: e.video.id, title: e.video.title, slug: e.video.slug },
    })),
    hasMore: page * limit < total,
    total,
  });
});
