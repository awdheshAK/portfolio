import { env } from '@/lib/env';
import { formatBytes } from '@/lib/utils';

export default function AdminSettingsPage() {
  const rows: [string, string][] = [
    ['Storage driver', env.storageDriver],
    ['Max upload size', formatBytes(env.maxUploadSizeBytes)],
    ['Upload chunk size', formatBytes(env.uploadChunkSizeBytes)],
    ['Processing concurrency', String(env.processingConcurrency)],
    ['AI provider', env.anthropicApiKey ? 'Anthropic (Claude)' : 'Local heuristic'],
    ['SMTP configured', env.smtp.host ? 'Yes' : 'No (emails logged to console)'],
    ['Rate limit', `${env.rateLimit.maxRequests} req / ${env.rateLimit.windowMs / 1000}s`],
    ['Download rate limit', `${env.rateLimit.downloadMax} downloads / minute`],
    ['Signed URL TTL', `${env.signedUrlTtlSeconds}s`],
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">System settings</h1>
      <p className="text-sm text-surface-500 mb-6">
        These values are configured via environment variables (<code>.env</code>) and require a server restart to
        change. See <code>.env.example</code> for the full list.
      </p>

      <div className="divide-y divide-surface-100 dark:divide-surface-800 rounded-xl border border-surface-200 dark:border-surface-800">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-surface-500">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
