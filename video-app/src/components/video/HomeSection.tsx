import Link from 'next/link';
import VideoCard, { VideoCardData } from './VideoCard';

export default function HomeSection({
  title,
  videos,
  seeAllHref,
}: {
  title: string;
  videos: VideoCardData[];
  seeAllHref?: string;
}) {
  if (videos.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            See all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}
