import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';
import { env } from '@/lib/env';

export const GET = withErrorHandling(async () => {
  await requireAdmin();

  const byKind = await prisma.videoFile.groupBy({
    by: ['kind'],
    _sum: { sizeBytes: true },
    _count: true,
  });

  const totalAgg = await prisma.videoFile.aggregate({ _sum: { sizeBytes: true }, _count: true });

  return NextResponse.json({
    driver: env.storageDriver,
    root: env.storageDriver === 'local' ? env.localStorageRoot : undefined,
    totalBytes: (totalAgg._sum.sizeBytes ?? BigInt(0)).toString(),
    totalFiles: totalAgg._count,
    byKind: byKind.map((k) => ({ kind: k.kind, bytes: (k._sum.sizeBytes ?? BigInt(0)).toString(), count: k._count })),
  });
});
