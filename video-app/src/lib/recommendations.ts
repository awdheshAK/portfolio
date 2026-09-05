/**
 * Personalized recommendations built from a user's own watch history,
 * search history, favorites, and engagement signals (views/likes) - never
 * from other users' data, so nothing private leaks across accounts.
 */
import { prisma } from './prisma';

const cardInclude = {
  owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
} as const;

export async function getRecommendedVideos(userId: string, limit = 12) {
  const [watchHistory, favorites, searches] = await Promise.all([
    prisma.watchHistory.findMany({
      where: { userId },
      include: { video: { select: { categoryId: true, tags: { include: { tag: true } } } } },
      orderBy: { updatedAt: 'desc' },
      take: 25,
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: { video: { select: { categoryId: true, tags: { include: { tag: true } } } } },
      take: 25,
    }),
    prisma.searchHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  const categoryWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const watchedVideoIds = new Set<string>();

  for (const entry of watchHistory) {
    watchedVideoIds.add((entry as any).videoId);
    const v = entry.video;
    if (v.categoryId) categoryWeights.set(v.categoryId, (categoryWeights.get(v.categoryId) ?? 0) + 2);
    for (const t of v.tags) tagWeights.set(t.tag.id, (tagWeights.get(t.tag.id) ?? 0) + 2);
  }
  for (const entry of favorites) {
    const v = entry.video;
    if (v.categoryId) categoryWeights.set(v.categoryId, (categoryWeights.get(v.categoryId) ?? 0) + 3);
    for (const t of v.tags) tagWeights.set(t.tag.id, (tagWeights.get(t.tag.id) ?? 0) + 3);
  }

  const topCategoryIds = [...categoryWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  const topTagIds = [...tagWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  const searchKeywords = searches.map((s) => s.query.toLowerCase());

  // Cold start: no history yet - fall back to trending/popular public videos.
  if (topCategoryIds.length === 0 && topTagIds.length === 0 && searchKeywords.length === 0) {
    return prisma.video.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: cardInclude,
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  const candidates = await prisma.video.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      id: { notIn: [...watchedVideoIds] },
      OR: [
        topCategoryIds.length ? { categoryId: { in: topCategoryIds } } : undefined,
        topTagIds.length ? { tags: { some: { tagId: { in: topTagIds } } } } : undefined,
        searchKeywords.length ? { title: { contains: searchKeywords[0], mode: 'insensitive' } } : undefined,
      ].filter(Boolean) as any,
    },
    include: cardInclude,
    orderBy: [{ viewCount: 'desc' }],
    take: limit * 3,
  });

  // Score candidates by weighted overlap, then take the top N.
  const scored = candidates.map((v) => {
    let score = v.viewCount * 0.01 + v.likeCount * 0.5;
    if (v.categoryId && categoryWeights.has(v.categoryId)) score += categoryWeights.get(v.categoryId)! * 5;
    for (const t of v.tags) if (tagWeights.has(t.tag.id)) score += tagWeights.get(t.tag.id)! * 3;
    return { video: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.video);
}
