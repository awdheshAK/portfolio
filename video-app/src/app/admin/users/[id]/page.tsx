'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Mail, Calendar, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatCard from '@/components/admin/StatCard';
import { formatCompactNumber, formatRelativeDate, cx } from '@/lib/utils';

interface UserDetail {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  role: string;
  status: string;
  createdAt: string;
  videos: {
    id: string;
    title: string;
    slug: string;
    status: string;
    visibility: string;
    viewCount: number;
    downloadCount: number;
    createdAt: string;
  }[];
  moderationActionsAgainst: { id: string; action: string; reason: string | null; createdAt: string; moderator: { name: string } }[];
  totalReportsFiled: number;
  totalViewsReceived: number;
  totalDownloadsReceived: number;
  _count: { videos: number; favorites: number; downloads: number; watchHistory: number };
}

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [notFoundErr, setNotFoundErr] = useState(false);

  function load() {
    fetch(`/api/admin/users/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((d) => setUser(d.user))
      .catch(() => setNotFoundErr(true));
  }

  useEffect(load, [params.id]);

  async function updateStatus(status: string) {
    const reason = status !== 'ACTIVE' ? prompt('Reason (shown to the user):') ?? undefined : undefined;
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    if (res.ok) {
      toast.success('User updated');
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? 'Could not update user.');
    }
  }

  function copyId() {
    navigator.clipboard.writeText(params.id);
    toast.success('User ID copied');
  }

  if (notFoundErr) {
    return (
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-brand-600 mb-4">
          <ArrowLeft size={14} /> Back to users
        </Link>
        <p className="text-surface-500">User not found.</p>
      </div>
    );
  }

  if (!user) return <p className="text-sm text-surface-400">Loading…</p>;

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-brand-600 mb-4">
        <ArrowLeft size={14} /> Back to users
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-surface-500 text-sm">@{user.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-500">
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> {user.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> Joined {formatRelativeDate(user.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={14} /> {user.role}
            </span>
          </div>
          <button
            onClick={copyId}
            className="mt-2 flex items-center gap-1.5 rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs font-mono text-surface-500 hover:text-surface-800 dark:hover:text-white"
            title="Copy full user ID"
          >
            <Copy size={12} /> {user.id}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cx(
              'rounded-full px-3 py-1.5 text-xs font-medium',
              user.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
            )}
          >
            {user.status}
          </span>
          {user.status === 'ACTIVE' ? (
            <>
              <Button variant="secondary" onClick={() => updateStatus('SUSPENDED')}>
                Suspend
              </Button>
              <Button variant="danger" onClick={() => updateStatus('BANNED')}>
                Ban
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => updateStatus('ACTIVE')}>
              Reinstate
            </Button>
          )}
        </div>
      </div>

      {user.bio && <p className="mb-6 text-sm text-surface-600 dark:text-surface-300">{user.bio}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Videos uploaded" value={user._count.videos} />
        <StatCard label="Views received" value={formatCompactNumber(user.totalViewsReceived)} />
        <StatCard label="Downloads received" value={formatCompactNumber(user.totalDownloadsReceived)} />
        <StatCard label="Favorites saved" value={user._count.favorites} />
      </div>

      <h2 className="text-lg font-bold mb-3">Uploaded videos</h2>
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800 mb-8">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Downloads</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {user.videos.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/watch/${v.slug}`} className="hover:text-brand-600">
                    {v.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-1 text-xs font-medium">{v.status}</span>
                </td>
                <td className="px-4 py-3">{formatCompactNumber(v.viewCount)}</td>
                <td className="px-4 py-3">{formatCompactNumber(v.downloadCount)}</td>
                <td className="px-4 py-3 text-surface-500">{formatRelativeDate(v.createdAt)}</td>
              </tr>
            ))}
            {user.videos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-surface-400">
                  This user hasn&apos;t uploaded any videos yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {user.moderationActionsAgainst.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Moderation history</h2>
          <div className="divide-y divide-surface-100 dark:divide-surface-800 rounded-xl border border-surface-200 dark:border-surface-800">
            {user.moderationActionsAgainst.map((a) => (
              <div key={a.id} className="p-4 text-sm">
                <p className="font-medium">
                  {a.action.replace(/_/g, ' ')} <span className="text-surface-400 font-normal">by {a.moderator.name}</span>
                </p>
                {a.reason && <p className="text-surface-500 mt-0.5">{a.reason}</p>}
                <p className="text-xs text-surface-400 mt-1">{formatRelativeDate(a.createdAt)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
