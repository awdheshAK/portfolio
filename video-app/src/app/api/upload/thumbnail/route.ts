import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireUser, withErrorHandling, ApiError } from '@/lib/apiAuth';
import { detectImage, generateInternalImageFilename } from '@/lib/validation';
import { getStorageProvider } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

const MAX_THUMBNAIL_BYTES = 8 * 1024 * 1024;

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData();
  const videoId = form.get('videoId');
  const file = form.get('file');

  if (typeof videoId !== 'string' || !(file instanceof File)) {
    throw new ApiError('Missing videoId or file.', 400);
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new ApiError('Video not found.', 404);
  if (video.ownerId !== user.id && user.role !== 'ADMIN') throw new ApiError('Forbidden.', 403);

  if (file.size > MAX_THUMBNAIL_BYTES) throw new ApiError('Thumbnail image exceeds 8MB.', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageType = detectImage(buffer);
  if (imageType === 'unknown') {
    throw new ApiError('Unsupported thumbnail format. Use JPG, PNG, or WebP.', 415);
  }

  // Re-encode through sharp to strip metadata and normalize dimensions -
  // never trust the uploaded bytes to be a "safe" image as-is.
  const normalized = await sharp(buffer).resize(1280, 720, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer();

  const storage = getStorageProvider();
  const key = generateInternalImageFilename('jpg');
  await storage.put('thumbnails', key, normalized);

  await prisma.video.update({ where: { id: videoId }, data: { thumbnailKey: key } });

  return NextResponse.json({ success: true, thumbnailKey: key });
});
