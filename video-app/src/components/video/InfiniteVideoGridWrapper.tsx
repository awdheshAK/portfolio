'use client';

import InfiniteVideoGrid from './InfiniteVideoGrid';
import { VideoCardData } from './VideoCard';

export default function InfiniteVideoGridWrapper({
  initialVideos,
  initialHasMore,
  fetchUrlBase,
}: {
  initialVideos: VideoCardData[];
  initialHasMore: boolean;
  fetchUrlBase: string;
}) {
  const separator = fetchUrlBase.includes('?') ? '&' : '?';
  return (
    <InfiniteVideoGrid
      initialVideos={initialVideos}
      initialHasMore={initialHasMore}
      fetchUrl={(page) => `${fetchUrlBase}${separator}page=${page}`}
    />
  );
}
