import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';

const Schema = z.object({ progressSec: z.number().min(0), completed: z.boolean().optional() });

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Invalid progress payload.', 400);

  await prisma.watchHistory.upsert({
    where: { userId_videoId: { userId: user.id, videoId: params.id } },
    update: { progressSec: parsed.data.progressSec, completed: parsed.data.completed ?? false },
    create: {
      userId: user.id,
      videoId: params.id,
      progressSec: parsed.data.progressSec,
      completed: parsed.data.completed ?? false,
    },
  });

  return NextResponse.json({ success: true });
});
