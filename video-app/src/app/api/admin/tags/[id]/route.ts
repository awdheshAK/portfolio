import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling } from '@/lib/apiAuth';
import { logAudit } from '@/lib/audit';

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  await prisma.tag.delete({ where: { id: params.id } });
  await logAudit({ userId: admin.id, action: 'tag.delete', targetType: 'Tag', targetId: params.id });
  return NextResponse.json({ success: true });
});
