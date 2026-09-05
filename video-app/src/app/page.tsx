import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeVideoCard } from '@/lib/serializers';
import { getRecommendedVideos } from '@/lib/recommendations';
import HomeSection from '@/components/video/HomeSection';
import InfiniteVideoGridWrapper from '@/components/video/InfiniteVideoGridWrapper';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const cardInclude = {
  owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
} as const;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [categories, featured, trending, popular, latest, latestTotal, recommended] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: cardInclude,
      orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
      take: 5,
    }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', publishedAt: { gte: new Date(Date.now() - 14 * 24 * 3600 * 1000) } },
      include: cardInclude,
      orderBy: { viewCount: 'desc' },
      take: 10,
    }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: cardInclude,
      orderBy: { viewCount: 'desc' },
      take: 10,
    }),
    prisma.video.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: cardInclude,
      orderBy: { publishedAt: 'desc' },
      take: 20,
    }),
    prisma.video.count({ where: { status: 'PUBLISHED', visibility: 'PUBLIC' } }),
    userId ? getRecommendedVideos(userId, 10) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
      {categories.length > 0 && (
        <div className="mb-8 flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="whitespace-nowrap rounded-full border border-surface-200 dark:border-surface-800 px-4 py-2 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {recommended.length > 0 && (
        <HomeSection title="Recommended for you" videos={recommended.map((v) => serializeVideoCard(v as any, userId))} />
      )}

      <HomeSection title="Featured" videos={featured.map((v) => serializeVideoCard(v as any, userId))} />
      <HomeSection title="Trending now" videos={trending.map((v) => serializeVideoCard(v as any, userId))} seeAllHref="/search?sort=popular" />
      <HomeSection title="Popular" videos={popular.map((v) => serializeVideoCard(v as any, userId))} seeAllHref="/search?sort=views" />

      <section>
        <h2 className="mb-4 text-lg font-bold">Latest uploads</h2>
        <InfiniteVideoGridWrapper
          initialVideos={latest.map((v) => serializeVideoCard(v as any, userId))}
          initialHasMore={20 < latestTotal}
          fetchUrlBase="/api/videos?section=latest"
        />
      </section>
    </div>
  );
}
