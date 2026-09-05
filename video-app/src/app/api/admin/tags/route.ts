import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { videos: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ tags });
});
