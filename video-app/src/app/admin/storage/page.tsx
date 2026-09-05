import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import StatCard from '@/components/admin/StatCard';
import { formatBytes } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const KIND_LABELS: Record<string, string> = {
  ORIGINAL: 'Original uploads',
  RENDITION: 'Transcoded renditions',
  THUMBNAIL: 'Thumbnails',
  PREVIEW: 'Hover previews',
  CAPTION: 'Captions',
};

export default async function AdminStoragePage() {
  const [byKind, totalAgg] = await Promise.all([
    prisma.videoFile.groupBy({ by: ['kind'], _sum: { sizeBytes: true }, _count: true }),
    prisma.videoFile.aggregate({ _sum: { sizeBytes: true }, _count: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Storage</h1>
      <p className="text-sm text-surface-500 mb-6">
        Driver: <strong>{env.storageDriver}</strong>
        {env.storageDriver === 'local' && (
          <>
            {' '}
            · Root: <code className="text-xs">{env.localStorageRoot}</code>
          </>
        )}
        . Switch <code>STORAGE_DRIVER=s3</code> in .env to move to cloud object storage without any code changes.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Total storage used" value={formatBytes(totalAgg._sum.sizeBytes ?? 0)} />
        <StatCard label="Total files" value={totalAgg._count} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="px-4 py-3">File type</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {byKind.map((k) => (
              <tr key={k.kind}>
                <td className="px-4 py-3 font-medium">{KIND_LABELS[k.kind] ?? k.kind}</td>
                <td className="px-4 py-3">{k._count}</td>
                <td className="px-4 py-3">{formatBytes(k._sum.sizeBytes ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
