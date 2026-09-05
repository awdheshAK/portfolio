import VideoCardSkeleton from '@/components/video/VideoCardSkeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
