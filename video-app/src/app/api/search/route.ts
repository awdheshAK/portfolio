import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUser, withErrorHandling } from '@/lib/apiAuth';
import { serializeVideoCard } from '@/lib/serializers';
import { parseSearchIntent } from '@/lib/ai';

export const GET = withErrorHandling(async (req: Request) => {
  const user = await getSessionUser();
  const { searchParams } = new URL(req.url);

  const q = searchParams.get('q')?.trim() ?? '';
  const categorySlug = searchParams.get('category') ?? undefined;
  const sortParam = searchParams.get('sort') ?? undefined;
  const minDuration = searchParams.get('minDuration') ? Number(searchParams.get('minDuration')) : undefined;
  const maxDuration = searchParams.get('maxDuration') ? Number(searchParams.get('maxDuration')) : undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 20)));

  const intent = q ? parseSearchIntent(q) : { keywords: [] as string[] };

  if (user?.id && q) {
    await prisma.searchHistory.create({ data: { userId: user.id, query: q } }).catch(() => {});
  }

  const where: Prisma.VideoWhereInput = { status: 'PUBLISHED', visibility: 'PUBLIC' };

  if (categorySlug) where.category = { slug: categorySlug };

  const effectiveMin = minDuration ?? intent.minDurationSec;
  const effectiveMax = maxDuration ?? intent.maxDurationSec;
  if (effectiveMin || effectiveMax) {
    where.durationSec = {
      ...(effectiveMin ? { gte: effectiveMin } : {}),
      ...(effectiveMax ? { lte: effectiveMax } : {}),
    };
  }
  if (intent.uploadedAfter) where.publishedAt = { gte: intent.uploadedAfter };

  const keywords = q ? (intent.keywords.length ? intent.keywords : [q]) : [];
  if (keywords.length > 0) {
    where.OR = keywords.flatMap((kw) => [
      { title: { contains: kw, mode: 'insensitive' as const } },
      { description: { contains: kw, mode: 'insensitive' as const } },
      { tags: { some: { tag: { name: { contains: kw, mode: 'insensitive' as const } } } } },
      { category: { name: { contains: kw, mode: 'insensitive' as const } } },
    ]);
  }

  let orderBy: Prisma.VideoOrderByWithRelationInput = { publishedAt: 'desc' };
  const sort = sortParam ?? intent.sortBy;
  if (sort === 'popular' || sort === 'views') orderBy = { viewCount: 'desc' };
  if (sort === 'duration') orderBy = { durationSec: 'desc' };
  if (sort === 'newest') orderBy = { publishedAt: 'desc' };

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.video.count({ where }),
  ]);

  return NextResponse.json({
    videos: videos.map((v) => serializeVideoCard(v as any, user?.id)),
    total,
    page,
    limit,
    hasMore: page * limit < total,
    interpretedFilters: {
      keywords: intent.keywords,
      minDurationSec: intent.minDurationSec,
      maxDurationSec: intent.maxDurationSec,
      uploadedAfter: intent.uploadedAfter,
      sortBy: intent.sortBy,
    },
  });
});
