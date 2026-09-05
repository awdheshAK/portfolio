import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/apiAuth';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';
import { logAudit, ipFromRequest } from '@/lib/audit';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
    .regex(/[0-9]/, 'Password must contain a number.'),
});

export const POST = withErrorHandling(async (req: Request) => {
  const rl = checkRateLimit(clientKeyFromRequest(req, 'register'), 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { name, username, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username: username.toLowerCase() }] },
  });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email or username already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userCount = await prisma.user.count();

  const user = await prisma.user.create({
    data: {
      name,
      username: username.toLowerCase(),
      email: normalizedEmail,
      passwordHash,
      // First registered user becomes admin so a fresh install has an admin account.
      role: userCount === 0 ? 'ADMIN' : 'USER',
    },
  });

  await logAudit({ userId: user.id, action: 'auth.register', ip: ipFromRequest(req) });

  return NextResponse.json({ success: true });
});

export const runtime = 'nodejs';
