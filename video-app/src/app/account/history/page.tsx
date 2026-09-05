'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AccountTabs from '@/components/account/AccountTabs';
import VideoCard, { VideoCardData } from '@/components/video/VideoCard';
import Button from '@/components/ui/Button';

export default function HistoryPage() {
  const [videos, setVideos] = useState<VideoCardData[] | null>(null);

  function load() {
    fetch('/api/account/history')
      .then((r) => r.json())
      .then((d) => setVideos(d.videos));
  }

  useEffect(load, []);

  async function clearAll() {
    await fetch('/api/account/history', { method: 'DELETE' });
    toast.success('Watch history cleared');
    setVideos([]);
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-1">Watch history</h1>
        {videos && videos.length > 0 && (
          <Button variant="secondary" onClick={clearAll}>
            Clear history
          </Button>
        )}
      </div>
      <AccountTabs />
      {videos === null ? (
        <p className="text-sm text-surface-400">Loading…</p>
      ) : videos.length === 0 ? (
        <EmptyState message="Videos you watch will show up here." />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-surface-400">
      <p>{message}</p>
    </div>
  );
}
