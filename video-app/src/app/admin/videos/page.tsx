'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ExternalLink, Search, AlertTriangle } from 'lucide-react';
import { formatCompactNumber, formatRelativeDate, cx } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface AdminVideo {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  moderationFlag: boolean;
  viewCount: number;
  createdAt: string;
  owner: { name: string; email: string };
  category: string | null;
}

const STATUSES = ['', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'PUBLISHED', 'UNPUBLISHED', 'REMOVED'];

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const limit = 25;

  function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (status) sp.set('status', status);
    sp.set('page', String(page));
    fetch(`/api/admin/videos?${sp.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.videos);
        setTotal(d.total);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, status]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAction(action: 'PUBLISHED' | 'UNPUBLISHED' | 'DELETE') {
    if (selected.size === 0) return;
    if (action === 'DELETE' && !confirm(`Delete ${selected.size} video(s)? This cannot be undone.`)) return;

    await Promise.all(
      Array.from(selected).map((id) =>
        action === 'DELETE'
          ? fetch(`/api/videos/${id}`, { method: 'DELETE' })
          : fetch(`/api/videos/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: action }),
            }),
      ),
    );
    toast.success('Bulk action completed');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Videos</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-1.5">
            <Search size={14} className="text-surface-400 mr-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or owner…"
              className="bg-transparent text-sm outline-none w-56"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-surface-500">{selected.size} selected</span>
            <Button variant="secondary" onClick={() => bulkAction('PUBLISHED')}>
              Publish
            </Button>
            <Button variant="secondary" onClick={() => bulkAction('UNPUBLISHED')}>
              Unpublish
            </Button>
            <Button variant="danger" onClick={() => bulkAction('DELETE')}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="w-8 px-4 py-3" />
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {!loading &&
              videos.map((v) => (
                <tr key={v.id} className={v.moderationFlag ? 'bg-red-50/50 dark:bg-red-950/10' : undefined}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[240px] truncate">
                    {v.moderationFlag && <AlertTriangle size={13} className="inline mr-1 text-red-500" />}
                    {v.title}
                  </td>
                  <td className="px-4 py-3 text-surface-500">{v.owner.name}</td>
                  <td className="px-4 py-3 text-surface-500">{v.category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs font-medium">{v.status}</span>
                  </td>
                  <td className="px-4 py-3">{formatCompactNumber(v.viewCount)}</td>
                  <td className="px-4 py-3 text-surface-500">{formatRelativeDate(v.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/watch/${v.slug}`} className="text-surface-400 hover:text-surface-700 dark:hover:text-white">
                      <ExternalLink size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-sm text-surface-400">Loading…</p>}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-surface-500">
        <span>
          Page {page} of {Math.max(1, Math.ceil(total / limit))} ({total} videos)
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button variant="secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
