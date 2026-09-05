import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { serializeVideoDetail } from '@/lib/serializers';
import { sanitizeTextField, slugify } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import { getStorageProvider } from '@/lib/storage';

const detailInclude = {
  owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
  files: true,
} as const;

async function findVideoByIdOrSlug(idOrSlug: string) {
  return prisma.video.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: detailInclude,
  });
}

function canView(video: NonNullable<Awaited<ReturnType<typeof findVideoByIdOrSlug>>>, user: { id: string; role: string } | null) {
  const isOwnerOrAdmin = user && (user.id === video.ownerId || user.role === 'ADMIN');
  if (isOwnerOrAdmin) return true;
  if (video.status !== 'PUBLISHED') return false;
  if (video.visibility === 'PRIVATE') return false;
  return true;
}

export const GET = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  const video = await findVideoByIdOrSlug(params.id);
  if (!video) throw new ApiError('Video not found.', 404);
  if (!canView(video, user)) throw new ApiError('This video is not available.', 404);

  return NextResponse.json({ video: serializeVideoDetail(video as any, user?.id) });
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.string().nullable().optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  status: z.enum(['PUBLISHED', 'UNPUBLISHED']).optional(),
});

export const PATCH = withErrorHandling(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError('Authentication required.', 401);

  const video = await prisma.video.findUnique({ where: { id: params.id } });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.ownerId !== user.id && user.role !== 'ADMIN') throw new ApiError('Forbidden.', 403);

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) throw new ApiError(parsed.error.errors[0]?.message ?? 'Invalid update.', 400);
  const data = parsed.data;

  if (data.status === 'PUBLISHED' && video.status !== 'READY' && video.status !== 'PUBLISHED' && video.status !== 'UNPUBLISHED') {
    throw new ApiError('This video is not ready to be published yet.', 400);
  }

  const updateData: Record<string, unknown> = {};
  if (data.title) updateData.title = sanitizeTextField(data.title, 150);
  if (data.description !== undefined) updateData.description = sanitizeTextField(data.description, 5000);
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.visibility) updateData.visibility = data.visibility;
  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'PUBLISHED') updateData.publishedAt = video.publishedAt ?? new Date();
  }

  if (data.tags) {
    await prisma.videoTag.deleteMany({ where: { videoId: video.id } });
    for (const name of data.tags) {
      const tagSlug = slugify(name);
      const tag = await prisma.tag.upsert({ where: { slug: tagSlug }, update: {}, create: { name, slug: tagSlug } });
      await prisma.videoTag.create({ data: { videoId: video.id, tagId: tag.id } });
    }
  }

  const updated = await prisma.video.update({ where: { id: video.id }, data: updateData, include: detailInclude });
  await logAudit({ userId: user.id, action: 'video.update', targetType: 'Video', targetId: video.id });

  return NextResponse.json({ video: serializeVideoDetail(updated as any, user.id) });
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError('Authentication required.', 401);

  const video = await prisma.video.findUnique({ where: { id: params.id }, include: { files: true } });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.ownerId !== user.id && user.role !== 'ADMIN') throw new ApiError('Forbidden.', 403);

  const storage = getStorageProvider();
  for (const file of video.files) {
    const bucket = file.kind === 'ORIGINAL' ? 'videos' : file.kind === 'THUMBNAIL' ? 'thumbnails' : file.kind === 'PREVIEW' ? 'previews' : 'transcoded';
    await storage.delete(bucket as any, file.storageKey).catch(() => {});
  }
  if (video.thumbnailKey) await storage.delete('thumbnails', video.thumbnailKey).catch(() => {});
  if (video.previewKey) await storage.delete('previews', video.previewKey).catch(() => {});

  await prisma.video.delete({ where: { id: video.id } });
  await logAudit({ userId: user.id, action: 'video.delete', targetType: 'Video', targetId: video.id });

  return NextResponse.json({ success: true });
});
