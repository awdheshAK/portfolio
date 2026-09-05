import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeVideoDetail, serializeVideoCard } from '@/lib/serializers';
import WatchClient from '@/components/video/WatchClient';
import VideoCard from '@/components/video/VideoCard';

export const dynamic = 'force-dynamic';

const detailInclude = {
  owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
  files: true,
} as const;

export default async function WatchPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);

  const video = await prisma.video.findFirst({
    where: { OR: [{ id: params.slug }, { slug: params.slug }] },
    include: detailInclude,
  });

  if (!video) notFound();

  const isOwnerOrAdmin = session?.user && (session.user.id === video.ownerId || session.user.role === 'ADMIN');
  if (!isOwnerOrAdmin && (video.status !== 'PUBLISHED' || video.visibility === 'PRIVATE')) notFound();

  const [related, recommended] = await Promise.all([
    prisma.video.findMany({
      where: {
        id: { not: video.id },
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        categoryId: video.categoryId ?? undefined,
      },
      include: { owner: { select: { id: true, name: true, username: true, avatarUrl: true } }, category: true, tags: { include: { tag: true } } },
      orderBy: { viewCount: 'desc' },
      take: 10,
    }),
    prisma.video.findMany({
      where: { id: { not: video.id }, status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: { owner: { select: { id: true, name: true, username: true, avatarUrl: true } }, category: true, tags: { include: { tag: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 8,
    }),
  ]);

  const favorite = session?.user
    ? await prisma.favorite.findUnique({ where: { userId_videoId: { userId: session.user.id, videoId: video.id } } })
    : null;

  const serialized = serializeVideoDetail(video as any, session?.user?.id);

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <WatchClient video={serialized} isFavorited={Boolean(favorite)} isSignedIn={Boolean(session?.user)} />

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-lg font-bold">More in {video.category?.name ?? 'this category'}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((v) => (
                  <VideoCard key={v.id} video={serializeVideoCard(v as any, session?.user?.id)} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <h2 className="mb-4 text-lg font-bold">Recommended</h2>
          <div className="space-y-4">
            {recommended.map((v) => (
              <RecommendedRow key={v.id} video={serializeVideoCard(v as any, session?.user?.id)} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function RecommendedRow({ video }: { video: ReturnType<typeof serializeVideoCard> }) {
  return (
    <a href={`/watch/${video.slug}`} className="flex gap-3 group">
      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-600">{video.title}</h4>
        <p className="mt-0.5 text-xs text-surface-500">{video.owner.name}</p>
        <p className="text-xs text-surface-400">{video.viewCount.toLocaleString()} views</p>
      </div>
    </a>
  );
}
