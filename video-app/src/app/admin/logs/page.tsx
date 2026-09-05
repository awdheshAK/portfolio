'use client';

import { useEffect, useState } from 'react';
import { formatRelativeDate } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface LogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  user: string;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/logs?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs);
        setHasMore(d.hasMore);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System logs</h1>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800 font-mono text-xs">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">{l.action}</td>
                <td className="px-4 py-3 text-surface-500">{l.targetType ? `${l.targetType}:${l.targetId?.slice(0, 8)}` : '—'}</td>
                <td className="px-4 py-3 text-surface-500 font-sans">{l.user}</td>
                <td className="px-4 py-3 text-surface-500 font-sans">{formatRelativeDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-sm text-surface-400">Loading…</p>}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <Button variant="secondary" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
