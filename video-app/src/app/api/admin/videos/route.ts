import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const status = searchParams.get('status') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)));

  const where: Prisma.VideoWhereInput = {};
  if (status) where.status = status as any;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { owner: { name: { contains: q, mode: 'insensitive' } } },
      { owner: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: { owner: { select: { name: true, email: true } }, category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      status: v.status,
      visibility: v.visibility,
      moderationFlag: v.moderationFlag,
      viewCount: v.viewCount,
      createdAt: v.createdAt,
      owner: v.owner,
      category: v.category?.name ?? null,
    })),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  });
});
