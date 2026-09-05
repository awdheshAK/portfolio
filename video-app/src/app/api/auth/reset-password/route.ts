import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/apiAuth';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';

const Schema = z.object({
  uid: z.string(),
  token: z.string(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
});

export const POST = withErrorHandling(async (req: Request) => {
  const rl = checkRateLimit(clientKeyFromRequest(req, 'reset-password'), 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const { uid, token, password } = parsed.data;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.userId !== uid || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This password reset link is invalid or has expired.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: uid }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ success: true });
});
