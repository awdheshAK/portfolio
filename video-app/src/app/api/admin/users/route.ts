import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';

export const GET = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 25;

  const where: Prisma.UserWhereInput = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { videos: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit, hasMore: page * limit < total });
});
