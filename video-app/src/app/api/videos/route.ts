import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUser, withErrorHandling } from '@/lib/apiAuth';
import { serializeVideoCard } from '@/lib/serializers';

const includeForCard = {
  owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.VideoInclude;

export const GET = withErrorHandling(async (req: Request) => {
  const user = await getSessionUser();
  const { searchParams } = new URL(req.url);

  const section = searchParams.get('section') ?? 'latest';
  const categorySlug = searchParams.get('category') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const ownerId = searchParams.get('ownerId') ?? undefined;

  const where: Prisma.VideoWhereInput = {
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
  };

  if (categorySlug) where.category = { slug: categorySlug };
  if (ownerId) {
    where.ownerId = ownerId;
    // Owners viewing their own catalog can see everything via /api/videos?ownerId=me handled in dashboard route instead.
  }

  let orderBy: Prisma.VideoOrderByWithRelationInput = { publishedAt: 'desc' };
  if (section === 'popular' || section === 'trending') orderBy = { viewCount: 'desc' };
  if (section === 'latest' || section === 'recent') orderBy = { publishedAt: 'desc' };
  if (section === 'featured') orderBy = [{ likeCount: 'desc' }, { viewCount: 'desc' }] as any;

  if (section === 'trending') {
    // Trending = high recent view velocity - approximate with videos published
    // in the last 14 days ranked by views.
    where.publishedAt = { gte: new Date(Date.now() - 14 * 24 * 3600 * 1000) };
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: includeForCard,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos: videos.map((v) => serializeVideoCard(v as any, user?.id)),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});
