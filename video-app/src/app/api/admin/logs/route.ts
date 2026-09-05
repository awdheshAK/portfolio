import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      user: l.user?.name ?? 'System',
      createdAt: l.createdAt,
    })),
    total,
    hasMore: page * limit < total,
  });
});
