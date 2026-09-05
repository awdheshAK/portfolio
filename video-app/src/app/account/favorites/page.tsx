'use client';

import { useEffect, useState } from 'react';
import AccountTabs from '@/components/account/AccountTabs';
import VideoCard, { VideoCardData } from '@/components/video/VideoCard';

export default function FavoritesPage() {
  const [videos, setVideos] = useState<VideoCardData[] | null>(null);

  useEffect(() => {
    fetch('/api/account/favorites')
      .then((r) => r.json())
      .then((d) => setVideos(d.videos));
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-1">Favorites</h1>
      <AccountTabs />
      {videos === null ? (
        <p className="text-sm text-surface-400">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center text-surface-400">
          <p>Videos you save will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
