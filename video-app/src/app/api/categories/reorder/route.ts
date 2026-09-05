import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';

const Schema = z.object({ orderedIds: z.array(z.string()).min(1) });

export const POST = withErrorHandling(async (req: Request) => {
  await requireAdmin();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Invalid payload.', 400);

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) => prisma.category.update({ where: { id }, data: { order: index } })),
  );

  return NextResponse.json({ success: true });
});
