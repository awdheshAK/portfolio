'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Upload, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCompactNumber, formatDuration, formatRelativeDate, cx } from '@/lib/utils';

interface DashboardVideo {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  durationSec: number | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  thumbnailUrl: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  UPLOADING: 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200',
  PROCESSING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  READY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  UNPUBLISHED: 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200',
  REMOVED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function CreatorDashboardPage() {
  const [videos, setVideos] = useState<DashboardVideo[] | null>(null);

  function load() {
    fetch('/api/dashboard/videos')
      .then((r) => r.json())
      .then((d) => setVideos(d.videos));
  }

  useEffect(load, []);

  async function togglePublish(v: DashboardVideo) {
    const nextStatus = v.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    const res = await fetch(`/api/videos/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? 'Could not update video.');
      return;
    }
    toast.success(nextStatus === 'PUBLISHED' ? 'Video published' : 'Video unpublished');
    load();
  }

  async function remove(v: DashboardVideo) {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/videos/${v.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Video deleted');
      load();
    } else {
      toast.error('Could not delete video.');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creator dashboard</h1>
          <p className="text-surface-500 text-sm">Manage your uploaded videos.</p>
        </div>
        <Link href="/upload">
          <Button>
            <Upload size={15} /> Upload video
          </Button>
        </Link>
      </div>

      {videos === null ? (
        <p className="text-sm text-surface-400">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-200 dark:border-surface-800 py-16 text-center text-surface-400">
          <p>You haven&apos;t uploaded any videos yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
              <tr>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Downloads</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {videos.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 shrink-0 rounded bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        {v.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[220px]">{v.title}</p>
                        <p className="text-xs text-surface-400">{formatDuration(v.durationSec)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cx('rounded-full px-2 py-1 text-xs font-medium', STATUS_COLORS[v.status])}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{v.visibility}</td>
                  <td className="px-4 py-3">{formatCompactNumber(v.viewCount)}</td>
                  <td className="px-4 py-3">{formatCompactNumber(v.downloadCount)}</td>
                  <td className="px-4 py-3 text-surface-500">{formatRelativeDate(v.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/watch/${v.slug}`} className="text-surface-400 hover:text-surface-700 dark:hover:text-white">
                        <ExternalLink size={16} />
                      </Link>
                      {(v.status === 'READY' || v.status === 'PUBLISHED' || v.status === 'UNPUBLISHED') && (
                        <button onClick={() => togglePublish(v)} className="text-surface-400 hover:text-surface-700 dark:hover:text-white">
                          {v.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                      <button onClick={() => remove(v)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
