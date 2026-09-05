'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import AccountTabs from '@/components/account/AccountTabs';
import { formatRelativeDate } from '@/lib/utils';

interface DownloadEntry {
  id: string;
  quality: string;
  createdAt: string;
  video: { id: string; title: string; slug: string };
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadEntry[] | null>(null);

  useEffect(() => {
    fetch('/api/account/downloads')
      .then((r) => r.json())
      .then((d) => setDownloads(d.downloads));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">Download history</h1>
      <AccountTabs />
      {downloads === null ? (
        <p className="text-sm text-surface-400">Loading…</p>
      ) : downloads.length === 0 ? (
        <div className="py-16 text-center text-surface-400">
          <p>Your downloaded videos will show up here.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-200 dark:divide-surface-800 rounded-xl border border-surface-200 dark:border-surface-800">
          {downloads.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-surface-400" />
                <div>
                  <Link href={`/watch/${d.video.slug}`} className="font-medium hover:text-brand-600">
                    {d.video.title}
                  </Link>
                  <p className="text-xs text-surface-400">
                    {d.quality} · {formatRelativeDate(d.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
