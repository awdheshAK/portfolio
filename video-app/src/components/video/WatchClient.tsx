'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Heart, Download, Flag, Share2 } from 'lucide-react';
import VideoPlayer, { Rendition } from '@/components/player/VideoPlayer';
import DownloadModal from './DownloadModal';
import ReportModal from './ReportModal';
import Button from '@/components/ui/Button';
import { formatCompactNumber, formatRelativeDate } from '@/lib/utils';

interface VideoDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  viewCount: number;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  owner: { username: string; name: string; avatarUrl: string | null };
  category: { name: string; slug: string } | null;
  tags: { id: string; name: string; slug: string }[];
  thumbnailUrl: string | null;
  renditions: Rendition[];
  aiGenerated: boolean;
  chapters: unknown;
}

export default function WatchClient({
  video,
  isFavorited,
  isSignedIn,
}: {
  video: VideoDetail;
  isFavorited: boolean;
  isSignedIn: boolean;
}) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const viewLogged = useRef(false);
  const lastProgressSave = useRef(0);

  useEffect(() => {
    if (viewLogged.current) return;
    viewLogged.current = true;
    fetch(`/api/videos/${video.id}/view`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  function onProgress(currentSec: number, durationSec: number) {
    if (!isSignedIn) return;
    if (currentSec - lastProgressSave.current < 5) return;
    lastProgressSave.current = currentSec;
    fetch(`/api/videos/${video.id}/watch-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progressSec: currentSec, completed: durationSec > 0 && currentSec / durationSec > 0.9 }),
    }).catch(() => {});
  }

  async function toggleFavorite() {
    if (!isSignedIn) {
      toast.error('Log in to save videos.');
      return;
    }
    const res = await fetch(`/api/videos/${video.id}/favorite`, { method: 'POST' });
    const data = await res.json();
    setFavorited(data.favorited);
    toast.success(data.favorited ? 'Added to favorites' : 'Removed from favorites');
  }

  function share() {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  }

  return (
    <div>
      <VideoPlayer renditions={video.renditions} posterUrl={video.thumbnailUrl} onProgress={onProgress} />

      <h1 className="mt-4 text-xl font-bold">{video.title}</h1>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 font-semibold text-brand-700 dark:text-brand-300">
            {video.owner.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold">{video.owner.name}</p>
            <p className="text-xs text-surface-500">@{video.owner.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={toggleFavorite}>
            <Heart size={15} className={favorited ? 'fill-red-500 text-red-500' : ''} /> {favorited ? 'Saved' : 'Save'}
          </Button>
          <Button variant="secondary" onClick={() => setDownloadOpen(true)}>
            <Download size={15} /> Download
          </Button>
          <Button variant="secondary" onClick={share}>
            <Share2 size={15} /> Share
          </Button>
          <Button variant="ghost" onClick={() => setReportOpen(true)}>
            <Flag size={15} />
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-surface-50 dark:bg-surface-900 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-surface-500 mb-2">
          <span>{formatCompactNumber(video.viewCount)} views</span>
          <span>·</span>
          <span>{formatRelativeDate(video.publishedAt ?? video.createdAt)}</span>
          {video.category && (
            <>
              <span>·</span>
              <Link href={`/category/${video.category.slug}`} className="text-brand-600 font-medium">
                {video.category.name}
              </Link>
            </>
          )}
          {video.aiGenerated && (
            <span className="rounded-full bg-brand-100 dark:bg-brand-900 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-300">
              AI-enhanced metadata
            </span>
          )}
        </div>
        {video.description && <p className="whitespace-pre-line text-sm text-surface-700 dark:text-surface-300">{video.description}</p>}

        {video.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {video.tags.map((t) => (
              <Link
                key={t.id}
                href={`/search?q=${encodeURIComponent(t.name)}`}
                className="rounded-full bg-surface-100 dark:bg-surface-800 px-3 py-1 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-700"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        {Array.isArray(video.chapters) && video.chapters.length > 1 && (
          <div className="mt-4 border-t border-surface-200 dark:border-surface-800 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase text-surface-400">Chapters</p>
            <div className="flex flex-wrap gap-2">
              {(video.chapters as { title: string; startSec: number }[]).map((c, i) => (
                <span key={i} className="rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs">
                  {c.title} — {Math.floor(c.startSec / 60)}:{String(Math.floor(c.startSec % 60)).padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {downloadOpen && <DownloadModal videoId={video.id} onClose={() => setDownloadOpen(false)} />}
      {reportOpen && <ReportModal videoId={video.id} onClose={() => setReportOpen(false)} />}
    </div>
  );
}
