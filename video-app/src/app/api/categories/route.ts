import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { slugify, sanitizeTextField } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

export const GET = withErrorHandling(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { videos: true } } },
  });
  return NextResponse.json({ categories });
});

const CreateSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const POST = withErrorHandling(async (req: Request) => {
  const admin = await requireAdmin();
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(parsed.error.errors[0]?.message ?? 'Invalid category.', 400);

  const name = sanitizeTextField(parsed.data.name, 60);
  const slug = slugify(name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ApiError('A category with this name already exists.', 409);

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || undefined,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  await logAudit({ userId: admin.id, action: 'category.create', targetType: 'Category', targetId: category.id });

  return NextResponse.json({ category });
});
