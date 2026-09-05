import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async () => {
  await requireAdmin();

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
    prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { owner: { select: { name: true, username: true } } },
    }),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  // Bandwidth is not metered per-byte in local mode - approximate using
  // average original file size times number of downloads served. Swap for
  // real byte counters (e.g. from a CDN access log) in production.
  const avgOriginalSize = await prisma.videoFile.aggregate({
    where: { kind: 'ORIGINAL' },
    _avg: { sizeBytes: true },
  });
  const estimatedBandwidthBytes = Math.round(Number(avgOriginalSize._avg.sizeBytes ?? 0) * totalDownloads);

  return NextResponse.json({
    totalUsers,
    totalVideos,
    publishedVideos,
    processingVideos,
    failedVideos,
    totalViews: totalViewsAgg._sum.viewCount ?? 0,
    totalDownloads,
    storageUsedBytes: (storageAgg._sum.sizeBytes ?? BigInt(0)).toString(),
    estimatedBandwidthBytes,
    pendingReports,
    recentUploads: recentUploads.map((v) => ({
      id: v.id,
      title: v.title,
      status: v.status,
      createdAt: v.createdAt,
      owner: v.owner.name,
    })),
  });
});
