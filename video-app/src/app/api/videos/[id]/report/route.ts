import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { checkRateLimit, clientKeyFromRequest } from '@/lib/rateLimit';
import { sanitizeTextField } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

const Schema = z.object({
  reason: z.enum(['SPAM', 'COPYRIGHT', 'HARASSMENT', 'ADULT_CONTENT', 'VIOLENCE', 'MISINFORMATION', 'OTHER']),
  details: z.string().max(1000).optional(),
});

export const POST = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const rl = checkRateLimit(clientKeyFromRequest(req, `report:${user.id}`), 10, 60_000);
  if (!rl.allowed) throw new ApiError('Too many reports submitted. Please try again later.', 429);

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Invalid report.', 400);

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) throw new ApiError('Video not found.', 404);

  const report = await prisma.report.create({
    data: {
      videoId: video.id,
      reportedById: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details ? sanitizeTextField(parsed.data.details, 1000) : undefined,
    },
  });

  await prisma.video.update({ where: { id: video.id }, data: { moderationFlag: true } });
  await logAudit({ userId: user.id, action: 'video.report', targetType: 'Report', targetId: report.id });

  return NextResponse.json({ success: true, reportId: report.id });
});
