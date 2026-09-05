'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Play } from 'lucide-react';
import { formatDuration, formatCompactNumber, formatRelativeDate } from '@/lib/utils';

export interface VideoCardData {
  id: string;
  title: string;
  slug: string;
  durationSec: number | null;
  thumbnailUrl: string | null;
  previewUrl?: string | null;
  viewCount: number;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  owner: { username: string; name: string; avatarUrl: string | null };
  category?: { name: string; slug: string } | null;
}

export default function VideoCard({ video, size = 'md' }: { video: VideoCardData; size?: 'sm' | 'md' | 'lg' }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/watch/${video.slug}`}
      className="group block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-100 dark:bg-surface-800">
        {video.thumbnailUrl ? (
          hover && video.previewUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={video.previewUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-surface-400">
            <Play size={28} />
          </div>
        )}
        {video.durationSec != null && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900 text-xs font-semibold text-brand-700 dark:text-brand-300">
          {video.owner.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0">
          <h3 className={`font-semibold leading-snug line-clamp-2 ${size === 'lg' ? 'text-base' : 'text-sm'}`}>{video.title}</h3>
          <p className="mt-0.5 truncate text-xs text-surface-500">{video.owner.name}</p>
          <p className="text-xs text-surface-400">
            {formatCompactNumber(video.viewCount)} views · {formatRelativeDate(video.publishedAt ?? video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
