import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeVideoCard } from '@/lib/serializers';
import { getRecommendedVideos } from '@/lib/recommendations';
import HomeSection from '@/components/video/HomeSection';
import InfiniteVideoGridWrapper from '@/components/video/InfiniteVideoGridWrapper';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const cardInclude = {
  owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
} as const;

type HomeData = {
  categories: Awaited<ReturnType<typeof prisma.category.findMany>>;
  featured: any[];
  trending: any[];
  popular: any[];
  latest: any[];
  latestTotal: number;
  recommended: any[];
};

const EMPTY_HOME_DATA: HomeData = {
  categories: [],
  featured: [],
  trending: [],
  popular: [],
  latest: [],
  latestTotal: 0,
  recommended: [],
};

/**
 * The home page must never show a raw crash screen just because the
 * database is briefly unreachable (e.g. Postgres not started yet, or a
 * misconfigured DATABASE_URL on a fresh install). If anything here throws,
 * we log the real error to the server console (where a developer can see
 * it) and render the page with empty sections plus a visible notice instead.
 */
async function loadHomeData(userId?: string): Promise<{ data: HomeData; dbError: boolean }> {
  try {
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

    return { data: { categories, featured, trending, popular, latest, latestTotal, recommended }, dbError: false };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[home] Could not load data from the database. Is PostgreSQL running and is DATABASE_URL correct in .env? Full error:',
      err,
    );
    return { data: EMPTY_HOME_DATA, dbError: true };
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id;

  const { data, dbError } = await loadHomeData(userId);
  const { categories, featured, trending, popular, latest, latestTotal, recommended } = data;

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
      {dbError && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Couldn&apos;t load videos right now.</p>
            <p>
              The app couldn&apos;t reach the database. Make sure PostgreSQL is running and that{' '}
              <code>DATABASE_URL</code> in your <code>.env</code> file is correct, then refresh this page. Check the
              terminal running <code>npm run dev</code> for the detailed error.
            </p>
          </div>
        </div>
      )}

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
