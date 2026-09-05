'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import InfiniteVideoGrid from '@/components/video/InfiniteVideoGrid';
import { VideoCardData } from '@/components/video/VideoCard';

const SORT_OPTIONS = [
  { value: '', label: 'Best match' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'views', label: 'Most viewed' },
  { value: 'duration', label: 'Longest' },
];

export default function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? '';

  const [videos, setVideos] = useState<VideoCardData[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [interpreted, setInterpreted] = useState<any>(null);

  function buildUrl(page: number) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (sort) sp.set('sort', sort);
    sp.set('page', String(page));
    return `/api/search?${sp.toString()}`;
  }

  useEffect(() => {
    setVideos(null);
    fetch(buildUrl(1))
      .then((r) => r.json())
      .then((data) => {
        setVideos(data.videos);
        setHasMore(data.hasMore);
        setTotal(data.total);
        setInterpreted(data.interpretedFilters);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  function setSort(value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set('sort', value);
    else sp.delete('sort');
    router.push(`/search?${sp.toString()}`);
  }

  const hasSmartFilters =
    interpreted && (interpreted.minDurationSec || interpreted.maxDurationSec || interpreted.uploadedAfter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{q ? `Results for "${q}"` : 'Browse videos'}</h1>
          {videos && <p className="text-sm text-surface-500">{total} videos found</p>}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-2 text-sm outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {hasSmartFilters && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-brand-50 dark:bg-brand-950/30 px-4 py-2.5 text-sm text-brand-700 dark:text-brand-300">
          <Sparkles size={15} />
          Understood as:{' '}
          {interpreted.minDurationSec && `longer than ${Math.round(interpreted.minDurationSec / 60)} min `}
          {interpreted.maxDurationSec && `shorter than ${Math.round(interpreted.maxDurationSec / 60)} min `}
          {interpreted.uploadedAfter && `uploaded recently `}
          {interpreted.sortBy && `sorted by ${interpreted.sortBy}`}
        </div>
      )}

      {videos === null ? (
        <p className="text-sm text-surface-400">Searching…</p>
      ) : (
        <InfiniteVideoGrid initialVideos={videos} initialHasMore={hasMore} fetchUrl={buildUrl} />
      )}
    </div>
  );
}
