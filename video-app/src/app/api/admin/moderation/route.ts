import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { logAudit } from '@/lib/audit';

const Schema = z.object({
  reportId: z.string().optional(),
  action: z.enum([
    'DISMISS_REPORT',
    'FLAG_VIDEO',
    'REMOVE_VIDEO',
    'UNPUBLISH_VIDEO',
    'REINSTATE_VIDEO',
    'SUSPEND_USER',
    'BAN_USER',
    'REINSTATE_USER',
  ]),
  reason: z.string().max(500).optional(),
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Invalid moderation action.', 400);
  const { reportId, action, reason } = parsed.data;

  const report = reportId
    ? await prisma.report.findUnique({ where: { id: reportId }, include: { video: true } })
    : null;
  if (reportId && !report) throw new ApiError('Report not found.', 404);

  const video = report?.video;

  switch (action) {
    case 'DISMISS_REPORT':
      if (!report) throw new ApiError('A report is required for this action.', 400);
      await prisma.report.update({ where: { id: report.id }, data: { status: 'DISMISSED' } });
      break;
    case 'FLAG_VIDEO':
      if (video) await prisma.video.update({ where: { id: video.id }, data: { moderationFlag: true, moderationNote: reason } });
      break;
    case 'REMOVE_VIDEO':
      if (video) await prisma.video.update({ where: { id: video.id }, data: { status: 'REMOVED', moderationNote: reason } });
      break;
    case 'UNPUBLISH_VIDEO':
      if (video) await prisma.video.update({ where: { id: video.id }, data: { status: 'UNPUBLISHED', moderationNote: reason } });
      break;
    case 'REINSTATE_VIDEO':
      if (video) await prisma.video.update({ where: { id: video.id }, data: { status: 'READY', moderationFlag: false, moderationNote: null } });
      break;
    case 'SUSPEND_USER':
      if (video) await prisma.user.update({ where: { id: video.ownerId }, data: { status: 'SUSPENDED' } });
      break;
    case 'BAN_USER':
      if (video) await prisma.user.update({ where: { id: video.ownerId }, data: { status: 'BANNED' } });
      break;
    case 'REINSTATE_USER':
      if (video) await prisma.user.update({ where: { id: video.ownerId }, data: { status: 'ACTIVE' } });
      break;
  }

  if (report && action !== 'DISMISS_REPORT') {
    await prisma.report.update({ where: { id: report.id }, data: { status: 'ACTIONED' } });
  }

  await prisma.moderationAction.create({
    data: {
      reportId: report?.id,
      moderatorId: admin.id,
      targetUserId: video?.ownerId,
      action,
      reason,
    },
  });

  await logAudit({ userId: admin.id, action: `moderation.${action.toLowerCase()}`, targetType: 'Report', targetId: report?.id });

  return NextResponse.json({ success: true });
});
