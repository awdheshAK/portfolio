import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeVideoCard } from '@/lib/serializers';
import InfiniteVideoGridClient from '@/components/video/InfiniteVideoGridWrapper';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const limit = 20;
  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: { categoryId: category.id, status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    }),
    prisma.video.count({ where: { categoryId: category.id, status: 'PUBLISHED', visibility: 'PUBLIC' } }),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center gap-4">
        {category.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.imageUrl} alt={category.name} className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && <p className="text-sm text-surface-500">{category.description}</p>}
          <p className="text-xs text-surface-400 mt-0.5">{total} videos</p>
        </div>
      </div>

      <InfiniteVideoGridClient
        initialVideos={videos.map((v) => serializeVideoCard(v as any, session?.user?.id))}
        initialHasMore={limit < total}
        fetchUrlBase={`/api/videos?section=recent&category=${category.slug}`}
      />
    </div>
  );
}
