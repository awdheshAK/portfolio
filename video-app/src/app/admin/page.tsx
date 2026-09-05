import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/admin/StatCard';
import { formatBytes, formatCompactNumber, formatRelativeDate, cx } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalVideos,
    publishedVideos,
    processingVideos,
    failedVideos,
    totalViewsAgg,
    totalDownloads,
    storageAgg,
    recentUploads,
    pendingReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.video.count({ where: { status: 'PUBLISHED' } }),
    prisma.video.count({ where: { status: { in: ['PROCESSING', 'UPLOADING'] } } }),
    prisma.video.count({ where: { status: 'FAILED' } }),
    prisma.video.aggregate({ _sum: { viewCount: true } }),
    prisma.download.count(),
    prisma.videoFile.aggregate({ _sum: { sizeBytes: true } }),
    prisma.video.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { owner: { select: { name: true } } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mb-8">
        <StatCard label="Total users" value={totalUsers} />
        <StatCard label="Total videos" value={totalVideos} />
        <StatCard label="Published" value={publishedVideos} />
        <StatCard label="Processing" value={processingVideos} />
        <StatCard label="Failed" value={failedVideos} />
        <StatCard label="Total views" value={formatCompactNumber(totalViewsAgg._sum.viewCount ?? 0)} />
        <StatCard label="Total downloads" value={formatCompactNumber(totalDownloads)} />
        <StatCard label="Storage used" value={formatBytes(storageAgg._sum.sizeBytes ?? 0)} />
      </div>

      {pendingReports > 0 && (
        <Link
          href="/admin/moderation"
          className="mb-8 flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300"
        >
          {pendingReports} report{pendingReports === 1 ? '' : 's'} awaiting moderation review
          <span>Review now →</span>
        </Link>
      )}

      <h2 className="text-lg font-bold mb-4">Recent uploads</h2>
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-900 text-left text-xs uppercase text-surface-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {recentUploads.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3 font-medium">{v.title}</td>
                <td className="px-4 py-3 text-surface-500">{v.owner.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={cx(
                      'rounded-full px-2 py-1 text-xs font-medium',
                      v.status === 'FAILED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : v.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                    )}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-surface-500">{formatRelativeDate(v.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
