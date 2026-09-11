import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { logAudit } from '@/lib/audit';

/**
 * Full profile for one user - the admin "who is this account" view: their
 * account id/email/join date plus everything tied to them (uploads, views
 * generated, downloads taken, reports filed/received). Nothing here is
 * exposed to other regular users - this route is admin-only.
 */
export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      videos: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          visibility: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      reportsFiled: { select: { id: true } },
      moderationActionsAgainst: {
        select: { id: true, action: true, reason: true, createdAt: true, moderator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { videos: true, favorites: true, downloads: true, watchHistory: true } },
    },
  });
  if (!user) throw new ApiError('User not found.', 404);

  const viewsAgg = await prisma.video.aggregate({
    where: { ownerId: user.id },
    _sum: { viewCount: true, downloadCount: true },
  });

  return NextResponse.json({
    user: {
      ...user,
      totalReportsFiled: user.reportsFiled.length,
      totalViewsReceived: viewsAgg._sum.viewCount ?? 0,
      totalDownloadsReceived: viewsAgg._sum.downloadCount ?? 0,
    },
  });
});

const Schema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  role: z.enum(['USER', 'CREATOR', 'ADMIN']).optional(),
  reason: z.string().max(500).optional(),
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError('Invalid update.', 400);

  if (params.id === admin.id && (parsed.data.status === 'SUSPENDED' || parsed.data.status === 'BANNED')) {
    throw new ApiError('You cannot suspend or ban your own account.', 400);
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) throw new ApiError('User not found.', 404);

  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.role) data.role = parsed.data.role;

  const updated = await prisma.user.update({ where: { id: params.id }, data });

  if (parsed.data.status && parsed.data.status !== target.status) {
    const actionType =
      parsed.data.status === 'SUSPENDED' ? 'SUSPEND_USER' : parsed.data.status === 'BANNED' ? 'BAN_USER' : 'REINSTATE_USER';
    await prisma.moderationAction.create({
      data: {
        moderatorId: admin.id,
        targetUserId: target.id,
        action: actionType,
        reason: parsed.data.reason,
      },
    });
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: parsed.data.status === 'ACTIVE' ? 'SYSTEM' : 'ACCOUNT_SUSPENDED',
        title: parsed.data.status === 'ACTIVE' ? 'Your account has been reinstated' : `Your account has been ${parsed.data.status.toLowerCase()}`,
        body: parsed.data.reason,
      },
    });
  }

  await logAudit({ userId: admin.id, action: 'admin.user.update', targetType: 'User', targetId: target.id, metadata: parsed.data });

  return NextResponse.json({ user: { id: updated.id, status: updated.status, role: updated.role } });
});
