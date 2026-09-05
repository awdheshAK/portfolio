'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatRelativeDate, cx } from '@/lib/utils';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  video: { id: string; title: string; slug: string; status: string; owner: { name: string } };
  reportedBy: { name: string; email: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  REVIEWING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ACTIONED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  DISMISSED: 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200',
  APPEALED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const sp = status ? `?status=${status}` : '';
    fetch(`/api/admin/reports${sp}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports));
  }, [status]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-2 text-sm"
        >
          {['', 'PENDING', 'REVIEWING', 'ACTIONED', 'DISMISSED', 'APPEALED'].map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Reported by</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {reports?.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link href={`/watch/${r.video.slug}`} className="font-medium hover:text-brand-600">
                    {r.video.title}
                  </Link>
                  <p className="text-xs text-surface-400">by {r.video.owner.name}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{r.reason.replace('_', ' ')}</p>
                  {r.details && <p className="text-xs text-surface-400 max-w-xs truncate">{r.details}</p>}
                </td>
                <td className="px-4 py-3 text-surface-500">{r.reportedBy.name}</td>
                <td className="px-4 py-3">
                  <span className={cx('rounded-full px-2 py-1 text-xs font-medium', STATUS_COLORS[r.status])}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-surface-500">{formatRelativeDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reports && <p className="p-4 text-sm text-surface-400">Loading…</p>}
        {reports && reports.length === 0 && <p className="p-4 text-sm text-surface-400">No reports found.</p>}
      </div>
    </div>
  );
}
