import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { logAudit } from '@/lib/audit';

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
