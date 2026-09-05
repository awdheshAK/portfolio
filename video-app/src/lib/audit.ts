import crypto from 'node:crypto';
import { prisma } from './prisma';

export function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export function ipFromRequest(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? null;
}

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? undefined,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata as any,
      ipHash: hashIp(params.ip),
    },
  });
}
