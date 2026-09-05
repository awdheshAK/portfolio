'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatRelativeDate } from '@/lib/utils';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  appealNote: string | null;
  createdAt: string;
  video: { id: string; title: string; slug: string; status: string; owner: { name: string } };
  reportedBy: { name: string; email: string };
}

export default function AdminModerationPage() {
  const [pending, setPending] = useState<Report[] | null>(null);
  const [appealed, setAppealed] = useState<Report[] | null>(null);

  function load() {
    Promise.all([
      fetch('/api/admin/reports?status=PENDING').then((r) => r.json()),
      fetch('/api/admin/reports?status=APPEALED').then((r) => r.json()),
    ]).then(([p, a]) => {
      setPending(p.reports);
      setAppealed(a.reports);
    });
  }

  useEffect(load, []);

  async function act(reportId: string, action: string) {
    const reason = ['REMOVE_VIDEO', 'SUSPEND_USER', 'BAN_USER'].includes(action)
      ? prompt('Reason for this action:') ?? undefined
      : undefined;
    const res = await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action, reason }),
    });
    if (res.ok) {
      toast.success('Action applied');
      load();
    } else {
      toast.error('Could not apply action.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert size={22} /> Moderation queue
      </h1>

      <h2 className="text-sm font-semibold uppercase text-surface-400 mb-3">Pending reports</h2>
      <div className="space-y-3 mb-10">
        {pending?.length === 0 && <p className="text-sm text-surface-400">Nothing pending review. 🎉</p>}
        {pending?.map((r) => (
          <div key={r.id} className="rounded-xl border border-surface-200 dark:border-surface-800 p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Link href={`/watch/${r.video.slug}`} className="font-semibold hover:text-brand-600">
                  {r.video.title}
                </Link>
                <p className="text-xs text-surface-500 mt-0.5">
                  Reported by {r.reportedBy.name} for <strong>{r.reason.replace('_', ' ')}</strong> · {formatRelativeDate(r.createdAt)}
                </p>
                {r.details && <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">{r.details}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => act(r.id, 'DISMISS_REPORT')}>
                  Dismiss
                </Button>
                <Button variant="secondary" onClick={() => act(r.id, 'UNPUBLISH_VIDEO')}>
                  Unpublish video
                </Button>
                <Button variant="danger" onClick={() => act(r.id, 'REMOVE_VIDEO')}>
                  Remove video
                </Button>
                <Button variant="danger" onClick={() => act(r.id, 'SUSPEND_USER')}>
                  Suspend user
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!pending && <p className="text-sm text-surface-400">Loading…</p>}
      </div>

      <h2 className="text-sm font-semibold uppercase text-surface-400 mb-3">Appeals</h2>
      <div className="space-y-3">
        {appealed?.length === 0 && <p className="text-sm text-surface-400">No open appeals.</p>}
        {appealed?.map((r) => (
          <div key={r.id} className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/10 p-4">
            <Link href={`/watch/${r.video.slug}`} className="font-semibold hover:text-brand-600">
              {r.video.title}
            </Link>
            <p className="text-xs text-surface-500 mt-0.5">Original action: {r.reason.replace('_', ' ')}</p>
            <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">&quot;{r.appealNote}&quot;</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => act(r.id, 'REINSTATE_VIDEO')}>
                Reinstate video
              </Button>
              <Button variant="secondary" onClick={() => act(r.id, 'REINSTATE_USER')}>
                Reinstate user
              </Button>
              <Button variant="danger" onClick={() => act(r.id, 'DISMISS_REPORT')}>
                Uphold decision
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
