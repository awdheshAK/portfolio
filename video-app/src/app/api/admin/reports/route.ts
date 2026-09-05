import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;

  const reports = await prisma.report.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      video: { select: { id: true, title: true, slug: true, status: true, ownerId: true, owner: { select: { name: true } } } },
      reportedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ reports });
});
