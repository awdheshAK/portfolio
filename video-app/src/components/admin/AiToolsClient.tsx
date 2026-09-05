'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';

export default function AiToolsClient({ providerLabel }: { providerLabel: string }) {
  const [videoId, setVideoId] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const [query, setQuery] = useState('Show me popular videos about cooking uploaded this week');
  const [intent, setIntent] = useState<any>(null);
  const [parsing, setParsing] = useState(false);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch('/api/admin/ai/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMetadata(data.metadata);
      toast.success('AI metadata regenerated');
    } catch (err: any) {
      toast.error(err.message ?? 'Could not regenerate metadata.');
    } finally {
      setRegenerating(false);
    }
  }

  async function testParse() {
    setParsing(true);
    try {
      const res = await fetch('/api/admin/ai/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setIntent(data.intent);
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Sparkles size={22} /> AI Tools
      </h1>
      <p className="text-sm text-surface-500 mb-8">
        AI features run against Anthropic&apos;s API when <code>ANTHROPIC_API_KEY</code> is set, and fall back to a
        fully local heuristic engine otherwise. Current provider: <strong>{providerLabel}</strong>.
      </p>

      <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-5 mb-8">
        <h2 className="font-semibold mb-3">Regenerate video metadata</h2>
        <FormField label="Video ID" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="clv..." />
        <Button onClick={regenerate} loading={regenerating} disabled={!videoId}>
          Regenerate
        </Button>
        {metadata && (
          <pre className="mt-4 rounded-lg bg-surface-50 dark:bg-surface-950 p-3 text-xs overflow-x-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        )}
      </div>

      <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-5">
        <h2 className="font-semibold mb-3">Test natural-language search parsing</h2>
        <FormField label="Query" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={testParse} loading={parsing}>
          Parse query
        </Button>
        {intent && (
          <pre className="mt-4 rounded-lg bg-surface-50 dark:bg-surface-950 p-3 text-xs overflow-x-auto">
            {JSON.stringify(intent, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
