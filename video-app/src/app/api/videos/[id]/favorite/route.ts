import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling } from '@/lib/apiAuth';

export const POST = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const existing = await prisma.favorite.findUnique({
    where: { userId_videoId: { userId: user.id, videoId: params.id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId: user.id, videoId: params.id } });
  return NextResponse.json({ favorited: true });
});
