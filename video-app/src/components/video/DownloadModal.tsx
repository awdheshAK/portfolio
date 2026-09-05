'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils';

interface Option {
  label: string;
  sizeBytes: string;
}

export default function DownloadModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/videos/${videoId}/download`)
      .then((r) => r.json())
      .then((d) => setOptions(d.options ?? []));
  }, [videoId]);

  async function download(label: string) {
    setBusy(label);
    try {
      const res = await fetch(`/api/videos/${videoId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality: label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Download unavailable.');
      window.location.href = data.url;
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Download unavailable.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal title="Download video" onClose={onClose}>
      {!options ? (
        <p className="text-sm text-surface-500">Loading available qualities…</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-surface-500">Download unavailable for this video.</p>
      ) : (
        <div className="space-y-2">
          {options.map((o) => (
            <button
              key={o.label}
              onClick={() => download(o.label)}
              disabled={busy !== null}
              className="flex w-full items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-60"
            >
              <span className="font-medium">{o.label}</span>
              <span className="flex items-center gap-2 text-surface-400">
                {formatBytes(Number(o.sizeBytes))}
                <Download size={14} />
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-surface-400">Download links expire after 5 minutes for your security.</p>
    </Modal>
  );
}
