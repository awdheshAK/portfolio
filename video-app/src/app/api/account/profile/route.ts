import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { sanitizeTextField } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, username: true, email: true, bio: true, avatarUrl: true, role: true, createdAt: true },
  });
  return NextResponse.json({ user: full });
});

const Schema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
});

export const PATCH = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(parsed.error.errors[0]?.message ?? 'Invalid update.', 400);

  const data: Record<string, unknown> = {};
  if (parsed.data.name) data.name = sanitizeTextField(parsed.data.name, 80);
  if (parsed.data.bio !== undefined) data.bio = sanitizeTextField(parsed.data.bio, 500);

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ success: true, user: { name: updated.name, bio: updated.bio } });
});
