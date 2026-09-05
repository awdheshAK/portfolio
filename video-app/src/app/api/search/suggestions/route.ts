import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const [titles, tags] = await Promise.all([
    prisma.video.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', title: { contains: q, mode: 'insensitive' } },
      select: { title: true },
      take: 5,
    }),
    prisma.tag.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true }, take: 5 }),
  ]);

  const suggestions = Array.from(new Set([...titles.map((t) => t.title), ...tags.map((t) => t.name)])).slice(0, 8);

  return NextResponse.json({ suggestions });
});
