'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const REASONS: { value: string; label: string }[] = [
  { value: 'SPAM', label: 'Spam or misleading' },
  { value: 'COPYRIGHT', label: 'Copyright infringement' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'ADULT_CONTENT', label: 'Adult content' },
  { value: 'VIOLENCE', label: 'Violence' },
  { value: 'MISINFORMATION', label: 'Misinformation' },
  { value: 'OTHER', label: 'Other' },
];

export default function ReportModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const [reason, setReason] = useState('SPAM');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not submit report.');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? 'Could not submit report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Report this video" onClose={onClose}>
      {submitted ? (
        <p className="text-sm text-surface-600 dark:text-surface-300">
          Thank you — your report has been submitted to our moderation team for review.
        </p>
      ) : (
        <div>
          <div className="space-y-2 mb-4">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm">
                <input type="radio" name="reason" checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details (optional)"
            rows={3}
            className="mb-4 w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <Button onClick={submit} loading={loading} className="w-full">
            Submit report
          </Button>
        </div>
      )}
    </Modal>
  );
}
