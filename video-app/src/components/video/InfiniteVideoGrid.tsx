'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import VideoCard, { VideoCardData } from './VideoCard';
import VideoCardSkeleton from './VideoCardSkeleton';

export default function InfiniteVideoGrid({
  initialVideos,
  fetchUrl,
  initialHasMore,
}: {
  initialVideos: VideoCardData[];
  fetchUrl: (page: number) => string;
  initialHasMore: boolean;
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(fetchUrl(nextPage));
      const data = await res.json();
      setVideos((prev) => [...prev, ...data.videos]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (videos.length === 0 && !loading) {
    return (
      <div className="py-20 text-center text-surface-400">
        <p className="text-lg font-medium mb-1">No videos found</p>
        <p className="text-sm">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
        {loading && Array.from({ length: 5 }).map((_, i) => <VideoCardSkeleton key={`sk-${i}`} />)}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-10" />}
    </div>
  );
}
