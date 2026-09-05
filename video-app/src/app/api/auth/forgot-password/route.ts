import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/apiAuth';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';
import { sendEmail, passwordResetEmail } from '@/lib/email';
import { env } from '@/lib/env';

const Schema = z.object({ email: z.string().email() });

export const POST = withErrorHandling(async (req: Request) => {
  const rl = checkRateLimit(clientKeyFromRequest(req, 'forgot-password'), 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });

  // Always return success - never reveal whether an email is registered.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${env.nextAuthUrl}/reset-password?token=${rawToken}&uid=${user.id}`;
    const { subject, html, text } = passwordResetEmail(resetUrl);
    await sendEmail(user.email, subject, html, text);
  }

  return NextResponse.json({ success: true });
});
