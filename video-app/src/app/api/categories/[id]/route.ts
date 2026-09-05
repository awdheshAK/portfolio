import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { sanitizeTextField, slugify } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

const UpdateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(parsed.error.errors[0]?.message ?? 'Invalid update.', 400);

  const data: Record<string, unknown> = {};
  if (parsed.data.name) {
    data.name = sanitizeTextField(parsed.data.name, 60);
    data.slug = slugify(data.name as string);
  }
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl || null;

  const category = await prisma.category.update({ where: { id: params.id }, data });
  await logAudit({ userId: admin.id, action: 'category.update', targetType: 'Category', targetId: category.id });

  return NextResponse.json({ category });
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();

  await prisma.video.updateMany({ where: { categoryId: params.id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id: params.id } });

  await logAudit({ userId: admin.id, action: 'category.delete', targetType: 'Category', targetId: params.id });

  return NextResponse.json({ success: true });
});
